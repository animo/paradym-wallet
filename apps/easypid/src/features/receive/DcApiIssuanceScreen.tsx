import type { DigitalCredentialsCreateRequest } from '@animo-id/expo-digital-credentials-api'
import { sendCreateErrorResponse, sendCreateResponse } from '@animo-id/expo-digital-credentials-api'
import { initializeAppAgent } from '@easypid/agent'
import { walletClient } from '@easypid/constants'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { useLingui } from '@lingui/react/macro'
import {
  acquireAuthorizationCodeAccessToken,
  acquireAuthorizationCodeUsingPresentation,
  acquirePreAuthorizedAccessToken,
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type DeferredCredential,
  type EitherAgent,
  extractOpenId4VcCredentialMetadata,
  getCredentialDisplayWithDefaults,
  getCredentialForDisplay,
  getCredentialForDisplayId,
  getCredentialsForProofRequest,
  getOpenId4VcCredentialDisplay,
  type MdocRecord,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  type SdJwtVcRecord,
  storeCredential,
  storeDeferredCredential,
  storeReceivedActivity,
  type W3cCredentialRecord,
  type W3cV2CredentialRecord,
} from '@package/agent'
import { shareProof } from '@package/agent/invitation/shareProof'
import { PinDotsInput, type PinDotsInputRef, Provider, SlideWizard } from '@package/app'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import { commonMessages } from '@package/translations'
import { Heading, HeroIcons, IconContainer, Paragraph, Stack, YStack } from '@package/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { type onPinSubmitProps, PinSlide } from '../share/slides/PinSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { InteractionErrorSlide } from './slides/InteractionErrorSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type DcApiIssuanceScreenProps = {
  request: DigitalCredentialsCreateRequest
}

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const getCredentialOfferRequestData = (request: DigitalCredentialsCreateRequest) => {
  const requestPayload = request.request as
    | { data?: unknown }
    | { requests?: Array<{ data?: unknown }> }
    | { providers?: Array<{ request?: unknown }> }
    | undefined

  if (!requestPayload) return undefined
  if ('requests' in requestPayload && Array.isArray(requestPayload.requests)) {
    return requestPayload.requests[0]?.data
  }
  if ('providers' in requestPayload && Array.isArray(requestPayload.providers)) {
    return requestPayload.providers[0]?.request
  }
  return requestPayload.data
}

const getCredentialOfferUri = (request: DigitalCredentialsCreateRequest) => {
  const data = getCredentialOfferRequestData(request)
  if (!data) return null

  if (typeof data === 'string') {
    const trimmed = data.trim()
    const parsed = trimmed.startsWith('{') || trimmed.startsWith('[') ? tryParseJson(trimmed) : undefined
    if (parsed) {
      return getCredentialOfferUri({
        ...request,
        request: { protocol: request.request?.protocol ?? 'openid4vci', data: parsed },
      })
    }

    return trimmed
  }

  if (typeof data !== 'object') return null

  const payload = data as Record<string, unknown>
  const credentialOfferUri =
    (payload.credential_offer_uri as string | undefined) ??
    (payload.credentialOfferUri as string | undefined) ??
    (payload.offer_uri as string | undefined) ??
    (payload.offerUri as string | undefined)

  if (credentialOfferUri) {
    return `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(credentialOfferUri)}`
  }

  const credentialOffer =
    (payload.credential_offer as object | undefined) ??
    (payload.credentialOffer as object | undefined) ??
    (payload.offer as object | undefined)

  if (credentialOffer) {
    return `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOffer))}`
  }

  if (payload.credential_issuer || payload.issuer) {
    return `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(payload))}`
  }

  return null
}

export function DcApiIssuanceScreen({ request }: DcApiIssuanceScreenProps) {
  const [storedLocale] = useStoredLocale()

  return (
    <SafeAreaProvider>
      <Provider disableInjectCSS defaultTheme="light" config={tamaguiConfig} customLocale={storedLocale}>
        <Stack flex-1 justifyContent="flex-end">
          <DcApiIssuanceScreenWithContext request={request} />
        </Stack>
      </Provider>
    </SafeAreaProvider>
  )
}

export function DcApiIssuanceScreenWithContext({ request }: DcApiIssuanceScreenProps) {
  const [agent, setAgent] = useState<EitherAgent>()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)
  const insets = useSafeAreaInsets()
  const { t } = useLingui()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<OpenId4VciResolvedCredentialOffer>()
  const [resolvedAuthorizationRequest, setResolvedAuthorizationRequest] =
    useState<OpenId4VciResolvedAuthorizationRequest>()

  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [credentialAttributes, setCredentialAttributes] = useState<Record<string, unknown>>()
  const [receivedRecord, setReceivedRecord] = useState<
    SdJwtVcRecord | MdocRecord | W3cCredentialRecord | W3cV2CredentialRecord
  >()

  const [deferredCredential, setDeferredCredential] =
    useState<Omit<DeferredCredential, 'id' | 'createdAt' | 'lastCheckedAt' | 'activityId'>>()

  const offerUri = useMemo(() => getCredentialOfferUri(request), [request])
  const requestType = request.type

  const hasSentResponse = useRef(false)
  const sendCreateResponseOnce = useCallback(
    (options: { response: string; type?: string; newEntryId?: string }) => {
      if (hasSentResponse.current) return
      hasSentResponse.current = true
      sendCreateResponse(options)
    },
    []
  )
  const sendCreateErrorResponseOnce = useCallback(
    (message: string) => {
      if (hasSentResponse.current) return
      hasSentResponse.current = true
      sendCreateErrorResponse({ errorMessage: message })
    },
    []
  )

  useEffect(() => {
    if (agent) return
    if (!offerUri) {
      sendCreateErrorResponseOnce('Invalid credential offer')
    }
  }, [agent, offerUri, sendCreateErrorResponseOnce])

  const onUnlock = useCallback(
    async (pin: string) => {
      setIsUnlocking(true)

      const unlockedAgent = await secureWalletKey
        .getWalletKeyUsingPin(pin, secureWalletKey.getWalletKeyVersion())
        .then(async (walletKey) =>
          initializeAppAgent({
            walletKey,
            walletKeyVersion: secureWalletKey.getWalletKeyVersion(),
          })
        )
        .catch((e) => {
          if (e instanceof InvalidPinError) {
            pinRef.current?.clear()
            pinRef.current?.shake()
            return undefined
          }

          sendCreateErrorResponseOnce('Error initializing wallet')
          return undefined
        })

      setIsUnlocking(false)
      if (!unlockedAgent) return
      setAgent(unlockedAgent)
    },
    [sendCreateErrorResponseOnce]
  )

  const onDecline = useCallback(() => {
    sendCreateErrorResponseOnce(t(commonMessages.informationRequestDeclined))
  }, [sendCreateErrorResponseOnce, t])

  const issuerMetadata = resolvedCredentialOffer?.metadata.credentialIssuer
  const configurationId = resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined
  const configuration = configurationId
    ? resolvedCredentialOffer?.offeredCredentialConfigurations[configurationId]
    : undefined

  const credentialDisplay = getCredentialDisplayWithDefaults(
    configuration && issuerMetadata
      ? getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(configuration, {
            display: issuerMetadata?.display,
            id: issuerMetadata?.credential_issuer,
          })
        )
      : {}
  )

  const setErrorReasonWithError = useCallback(
    (baseMessage: string, error: unknown) => {
      if (isDevelopmentModeEnabled && error instanceof Error) {
        setErrorReason(`${baseMessage}\n\nDevelopment mode error:\n${error.message}`)
      } else {
        setErrorReason(baseMessage)
      }
    },
    [isDevelopmentModeEnabled]
  )

  const shouldUsePinForPresentation = useShouldUsePinForSubmission(credentialsForRequest?.formattedSubmission)
  const preAuthGrant =
    resolvedCredentialOffer?.credentialOfferPayload.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']
  const txCode = preAuthGrant?.tx_code

  useEffect(() => {
    if (!offerUri) return
    resolveOpenId4VciOffer({
      agent,
      offer: {
        uri: offerUri,
      },
      authorization: walletClient,
    })
      .then(({ resolvedAuthorizationRequest, resolvedCredentialOffer }) => {
        setResolvedCredentialOffer(resolvedCredentialOffer)
        setResolvedAuthorizationRequest(resolvedAuthorizationRequest)
      })
      .catch((error) => {
        setErrorReasonWithError(t(commonMessages.credentialInformationCouldNotBeExtracted), error)
        agent.config.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [offerUri, agent, setErrorReasonWithError, t])

  const retrieveCredentials = useCallback(
    async (
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
      tokenResponse: OpenId4VciRequestTokenResponse,
      configurationId: string,
      resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequest
    ) => {
      const { credentials, deferredCredentials } = await receiveCredentialFromOpenId4VciOffer({
        agent,
        resolvedCredentialOffer,
        credentialConfigurationIdsToRequest: [configurationId],
        accessToken: tokenResponse,
        clientId: resolvedAuthorizationRequest ? walletClient.clientId : undefined,
        requestBatch: true,
      })

      if (deferredCredentials.length && credentials.length) {
        setErrorReasonWithError(
          t(commonMessages.credentialInformationCouldNotBeExtracted),
          new Error('Received both immediate and deferred credentials')
        )
        agent.config.logger.error('Received both immediate and deferred credentials in OpenID4VCI response')
        return
      }

      if (deferredCredentials.length) {
        setDeferredCredential({
          accessToken: {
            ...tokenResponse,
            dpop: tokenResponse.dpop ? { ...tokenResponse.dpop, jwk: tokenResponse.dpop.jwk.toJson() } : undefined,
          },
          response: deferredCredentials[0],
          issuerMetadata: resolvedCredentialOffer.metadata,
          clientId: resolvedAuthorizationRequest ? walletClient.clientId : undefined,
        })
      }

      if (credentials.length) {
        const credentialRecord = credentials[0].credential
        const { attributes } = getCredentialForDisplay(credentialRecord)
        setCredentialAttributes(attributes)
        setReceivedRecord(credentialRecord)
      }
    },
    [agent, setErrorReasonWithError, t]
  )

  const onProofDecline = async () => {
    sendCreateErrorResponseOnce(t(commonMessages.informationRequestDeclined))
  }

  const onCompleteCredentialRetrieval = async () => {
    if (!receivedRecord && !deferredCredential) return

    let deferredCredentialId: string | undefined

    try {
      if (receivedRecord) {
        await storeCredential(agent, receivedRecord)
      } else if (deferredCredential) {
        const { id } = await storeDeferredCredential(agent, deferredCredential)
        deferredCredentialId = id
      }

      await storeReceivedActivity(agent, {
        entityId: resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
        host: credentialDisplay.issuer.domain,
        name: credentialDisplay.issuer.name,
        logo: credentialDisplay.issuer.logo,
        backgroundColor: '#ffffff',
        status: deferredCredentialId ? 'pending' : 'success',
        deferredCredentials: deferredCredentialId ? [credentialDisplay] : [],
        credentialIds: receivedRecord ? [getCredentialForDisplayId(receivedRecord)] : [],
      })

      setIsCompleted(true)
      sendCreateResponseOnce({
        response: JSON.stringify({ protocol: 'openid4vci', data: {} }),
        type: requestType,
        newEntryId: receivedRecord ? getCredentialForDisplayId(receivedRecord) : deferredCredentialId,
      })
    } catch (error) {
      agent.config.logger.error('Error storing credentials', {
        error,
      })
      setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
    }
  }

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (!resolvedCredentialOffer || !resolvedAuthorizationRequest || !configurationId) {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }
      try {
        const tokenResponse = await acquireAuthorizationCodeAccessToken({
          agent,
          resolvedCredentialOffer,
          redirectUri: walletClient.redirectUri,
          authorizationCode,
          clientId: walletClient.clientId,
          dPopKeyJwk: resolvedAuthorizationRequest.dpop?.jwk,
          codeVerifier:
            'codeVerifier' in resolvedAuthorizationRequest ? resolvedAuthorizationRequest.codeVerifier : undefined,
        })

        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId, resolvedAuthorizationRequest)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [
      resolvedCredentialOffer,
      resolvedAuthorizationRequest,
      retrieveCredentials,
      agent,
      configurationId,
      setErrorReasonWithError,
      t,
    ]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (!resolvedCredentialOffer || !configurationId) {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      try {
        const tokenResponse = await acquirePreAuthorizedAccessToken({
          agent,
          resolvedCredentialOffer,
          txCode,
        })
        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId)
      } catch (error) {
        agent.config.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [resolvedCredentialOffer, agent, retrieveCredentials, configurationId, setErrorReasonWithError, t]
  )

  const parsePresentationRequestUrl = useCallback(
    (oid4vpRequestUrl: string) =>
      getCredentialsForProofRequest({
        agent,
        uri: oid4vpRequestUrl,
      })
        .then(setCredentialsForRequest)
        .catch((error) => {
          setErrorReasonWithError(t(commonMessages.presentationInformationCouldNotBeExtracted), error)
          agent.config.logger.error('Error getting credentials for request', {
            error,
          })
        }),
    [agent, setErrorReasonWithError, t]
  )

  const onCheckCardContinue = useCallback(async () => {
    if (preAuthGrant && !preAuthGrant.tx_code) {
      await acquireCredentialsPreAuth()
    }
    if (
      !preAuthGrant &&
      resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance
    ) {
      await parsePresentationRequestUrl(resolvedAuthorizationRequest.openid4vpRequestUrl)
    }
  }, [acquireCredentialsPreAuth, parsePresentationRequestUrl, preAuthGrant, resolvedAuthorizationRequest])

  const onSubmitTxCode = useCallback(
    async (txCode: string) => {
      await acquireCredentialsPreAuth(txCode)
    },
    [acquireCredentialsPreAuth]
  )

  const onPresentationAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: onPinSubmitProps) => {
      if (
        !credentialsForRequest ||
        !resolvedCredentialOffer ||
        !resolvedAuthorizationRequest ||
        resolvedAuthorizationRequest.authorizationFlow !== OpenId4VciAuthorizationFlow.PresentationDuringIssuance
      ) {
        setErrorReason(t(commonMessages.presentationInformationCouldNotBeExtracted))
        return
      }

      setIsSharingPresentation(true)

      if (shouldUsePinForPresentation) {
        if (!pin) {
          setErrorReason(t(commonMessages.pinRequiredToAcceptPresentation))
          return
        }
        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (error) {
          if (error instanceof InvalidPinError) {
            onPinError?.()
            setIsSharingPresentation(false)
            return
          }

          setErrorReasonWithError(t(commonMessages.presentationInformationCouldNotBeExtracted), error)
          return
        }
      }

      try {
        const { presentationDuringIssuanceSession } = await shareProof({
          agent,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
        })

        const { authorizationCode } = await acquireAuthorizationCodeUsingPresentation({
          resolvedCredentialOffer,
          authSession: resolvedAuthorizationRequest.authSession,
          presentationDuringIssuanceSession,
          agent,
          dPopKeyJwk: resolvedAuthorizationRequest?.dpop?.jwk,
        })

        await acquireCredentialsAuth(authorizationCode)
        onPinComplete?.()
        setIsSharingPresentation(false)
      } catch (error) {
        setIsSharingPresentation(false)
        if (error instanceof BiometricAuthenticationCancelledError) {
          setErrorReason(t(commonMessages.biometricAuthenticationCancelled))
          return
        }
        if (error instanceof InvalidPinError) {
          onPinError?.()
          return
        }

        agent.config.logger.error('Error accepting presentation', {
          error,
        })
        setErrorReasonWithError(t(commonMessages.presentationCouldNotBeShared), error)
      }
    },
    [
      credentialsForRequest,
      agent,
      t,
      acquireCredentialsAuth,
      resolvedAuthorizationRequest,
      resolvedCredentialOffer,
      shouldUsePinForPresentation,
      setErrorReasonWithError,
    ]
  )

  const onCancel = () => sendCreateErrorResponseOnce(errorReason ?? t(commonMessages.error))

  const onGoToWallet = () =>
    sendCreateResponseOnce({
      response: JSON.stringify({ protocol: 'openid4vci', data: {} }),
      type: requestType,
      newEntryId: receivedRecord ? getCredentialForDisplayId(receivedRecord) : undefined,
    })

  const isAuthFlow =
    !preAuthGrant &&
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance &&
    credentialsForRequest

  const isPreAuthWithTxFlow = preAuthGrant && txCode

  const isBrowserAuthFlow =
    !preAuthGrant &&
    resolvedCredentialOffer &&
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.Oauth2Redirect

  const onCancelAuthorization = useCallback(
    (errorMessage?: string) => setErrorReason(errorMessage ?? t(commonMessages.authorizationCancelled)),
    [t]
  )
  const onErrorAuthorization = useCallback(
    (errorMessage?: string) => setErrorReason(errorMessage ?? t(commonMessages.authorizationFailed)),
    [t]
  )

  if (!agent) {
    return (
      <YStack
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
        backgroundColor="white"
        gap="$5"
        p="$4"
        paddingBottom={insets.bottom ?? '$6'}
      >
        <YStack>
          <Stack flexDirection="row" jc="space-between" ai="center">
            <Heading>{t(commonMessages.enterPin)}</Heading>
            <IconContainer aria-label="Cancel" icon={<HeroIcons.X />} onPress={onDecline} />
          </Stack>
          {request.origin ? <Paragraph variant="annotation">{request.origin}</Paragraph> : null}
        </YStack>

        <Stack pt="$5">
          <PinDotsInput
            onPinComplete={onUnlock}
            isLoading={isUnlocking}
            pinLength={6}
            ref={pinRef}
            useNativeKeyboard={false}
          />
        </Stack>
      </YStack>
    )
  }

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: (
            <LoadingRequestSlide key="loading-request" isLoading={!resolvedCredentialOffer} isError={!!errorReason} />
          ),
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={credentialDisplay.issuer.name}
              logo={credentialDisplay.issuer.logo}
              entityId={issuerMetadata?.credential_issuer}
              onContinue={onCheckCardContinue}
            />
          ),
        },
        isBrowserAuthFlow
          ? {
              step: 'auth-code-flow',
              progress: 49.5,
              backIsCancel: true,
              screen: (
                <AuthCodeFlowSlide
                  key="auth-code-flow"
                  display={credentialDisplay}
                  authCodeFlowDetails={{
                    openUrl: resolvedAuthorizationRequest.authorizationRequestUrl,
                    redirectUri: walletClient.redirectUri,
                    domain: resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onCancel={onCancelAuthorization}
                  onError={onErrorAuthorization}
                />
              ),
            }
          : {
              step: 'check-card',
              progress: 49.5,
              screen: (
                <CredentialCardSlide
                  key="credential-card"
                  type={isAuthFlow ? 'presentation' : isPreAuthWithTxFlow ? 'pin' : 'noAuth'}
                  display={credentialDisplay}
                />
              ),
            },
        isAuthFlow
          ? {
              step: 'presentation-during-issuance',
              progress: 66,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="share-credentials"
                  onAccept={shouldUsePinForPresentation ? undefined : () => onPresentationAccept({})}
                  logo={credentialsForRequest.verifier.logo}
                  submission={credentialsForRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  onDecline={onProofDecline}
                  overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
                />
              ),
            }
          : undefined,
        isAuthFlow && shouldUsePinForPresentation
          ? {
              step: 'pin-enter',
              progress: 82.5,
              screen: <PinSlide key="pin-enter" isLoading={isSharingPresentation} onPinSubmit={onPresentationAccept} />,
            }
          : undefined,
        isPreAuthWithTxFlow
          ? {
              step: 'tx-code',
              progress: 66,
              backIsCancel: true,
              screen: <TxCodeSlide txCode={txCode} onTxCode={onSubmitTxCode} />,
            }
          : undefined,

        {
          step: 'retrieve-credential',
          progress: 82.5,
          backIsCancel: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={credentialDisplay}
              attributes={credentialAttributes ?? {}}
              deferred={deferredCredential !== undefined}
              isCompleted={isCompleted}
              onAccept={onCompleteCredentialRetrieval}
            />
          ),
        },
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined)}
      errorScreen={() => (
        <InteractionErrorSlide
          key="credential-error"
          flowType="issue"
          reason={errorReason}
          onCancel={() => sendCreateErrorResponseOnce(errorReason ?? 'Credential issuance failed')}
        />
      )}
      isError={errorReason !== undefined}
      onCancel={onProofDecline}
      confirmation={{
        title: t({
          id: 'receiveCredential.stopTitle',
          message: 'Stop card offer?',
        }),
        description: t({
          id: 'receiveCredential.stopDescription',
          message: 'If you stop, the card offer will be cancelled.',
        }),
      }}
    />
  )
}
