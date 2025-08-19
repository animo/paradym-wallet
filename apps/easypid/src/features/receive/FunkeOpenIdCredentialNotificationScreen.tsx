import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import { appScheme } from '@easypid/constants'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { refreshPid } from '@easypid/use-cases/RefreshPidUseCase'
import { acquireAuthorizationCodeAccessToken, acquireAuthorizationCodeUsingPresentation } from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import {
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
} from '@paradym/wallet-sdk'
import { getCredentialDisplayWithDefaults } from '@paradym/wallet-sdk/display/common'
import { getCredentialForDisplay, getCredentialForDisplayId } from '@paradym/wallet-sdk/display/credential'
import { getOpenId4VcCredentialDisplay } from '@paradym/wallet-sdk/display/openid4vc'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import {
  acquirePreAuthorizedAccessToken,
  receiveCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
} from '@paradym/wallet-sdk/invitation/resolver'
import { shareProof } from '@paradym/wallet-sdk/invitation/shareProof'
import { extractOpenId4VcCredentialMetadata } from '@paradym/wallet-sdk/metadata/credentials'
import {
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
} from '@paradym/wallet-sdk/openid4vc/getCredentialsForProofRequest'
import { addReceivedActivity } from '@paradym/wallet-sdk/storage/activities'
import { storeCredential } from '@paradym/wallet-sdk/storage/credentials'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { PinSlide, type onPinSubmitProps } from '../share/slides/PinSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { InteractionErrorSlide } from './slides/InteractionErrorSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri: string }

// TODO: clientId
const authorization = {
  clientId: 'wallet',
  redirectUri: `${appScheme}:///wallet/redirect`,
}

export function FunkeCredentialNotificationScreen() {
  const { paradym } = useParadym('unlocked')
  const params = useLocalSearchParams<Query>()
  const toast = useToastController()

  const pushToWallet = usePushToWallet()

  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<OpenId4VciResolvedCredentialOffer>()
  const [resolvedAuthorizationRequest, setResolvedAuthorizationRequest] =
    useState<OpenId4VciResolvedAuthorizationRequest>()

  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [credentialAttributes, setCredentialAttributes] = useState<Record<string, unknown>>()
  const [receivedRecord, setReceivedRecord] = useState<SdJwtVcRecord | MdocRecord | W3cCredentialRecord>()

  // TODO: where to transform?
  // Combine oid4vci issuer metadata and openid fed into one pipeline. If openid it's trusted
  const issuerMetadata = resolvedCredentialOffer?.metadata.credentialIssuer
  // We want the first supported configuration id
  // TODO: handle empty configuration ids
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
    resolveOpenId4VciOffer({
      agent: paradym.agent,
      offer: {
        uri: params.uri,
      },
      authorization,
    })
      .then(({ resolvedAuthorizationRequest, resolvedCredentialOffer }) => {
        setResolvedCredentialOffer(resolvedCredentialOffer)
        setResolvedAuthorizationRequest(resolvedAuthorizationRequest)
      })
      .catch((error) => {
        setErrorReasonWithError('Credential information could not be extracted', error)
        paradym.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [params.uri, paradym.agent, setErrorReasonWithError, paradym.logger.error])

  const retrieveCredentials = useCallback(
    async (
      resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
      tokenResponse: OpenId4VciRequestTokenResponse,
      configurationId: string,
      resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequest
    ) => {
      const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
        agent: paradym.agent,
        resolvedCredentialOffer,
        credentialConfigurationIdsToRequest: [configurationId],
        accessToken: tokenResponse,
        clientId: resolvedAuthorizationRequest ? authorization.clientId : undefined,
        // Always request batch for non pid credentials
        requestBatch: true,
      })

      const credentialRecord = credentialResponses[0].credential
      const { attributes } = getCredentialForDisplay(credentialRecord)
      setCredentialAttributes(attributes)
      setReceivedRecord(credentialRecord)
    },
    [paradym.agent]
  )

  // TODO: Should we add this to the activitiy? We also don't do it for issuance
  const onProofDecline = async () => {
    toast.show('Information request has been declined.', { customData: { preset: 'danger' } })
    pushToWallet('back')
  }

  const onCompleteCredentialRetrieval = async () => {
    if (!receivedRecord) return

    await storeCredential(paradym.agent, receivedRecord)
    await addReceivedActivity(paradym.agent, {
      // FIXME: Should probably be the `iss`, but then we can't show it before we retrieved
      // the credential. Signed issuer metadata is the solution.
      entityId: resolvedCredentialOffer?.metadata.credentialIssuer.credential_issuer,
      host: credentialDisplay.issuer.domain,
      name: credentialDisplay.issuer.name,
      logo: credentialDisplay.issuer.logo,
      backgroundColor: '#ffffff', // Default to a white background for now
      credentialIds: [getCredentialForDisplayId(receivedRecord)],
    })
    setIsCompleted(true)
  }

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (!resolvedCredentialOffer || !resolvedAuthorizationRequest || !configurationId) {
        setErrorReason('Credential information could not be extracted')
        return
      }
      try {
        const tokenResponse = await acquireAuthorizationCodeAccessToken({
          agent: paradym.agent,
          resolvedCredentialOffer,
          redirectUri: authorization.redirectUri,
          authorizationCode,
          clientId: authorization.clientId,
          codeVerifier:
            'codeVerifier' in resolvedAuthorizationRequest ? resolvedAuthorizationRequest.codeVerifier : undefined,
        })

        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId, resolvedAuthorizationRequest)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError('Error while retrieving credentials', error)
      }
    },
    [
      resolvedCredentialOffer,
      resolvedAuthorizationRequest,
      retrieveCredentials,
      paradym.agent,
      configurationId,
      setErrorReasonWithError,
      paradym.logger.error,
    ]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (!resolvedCredentialOffer || !configurationId) {
        setErrorReason('Credential information could not be extracted')
        return
      }

      try {
        const tokenResponse = await acquirePreAuthorizedAccessToken({
          agent: paradym.agent,
          resolvedCredentialOffer,
          txCode,
        })
        await retrieveCredentials(resolvedCredentialOffer, tokenResponse, configurationId)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError('Error while retrieving credentials', error)
      }
    },
    [
      resolvedCredentialOffer,
      paradym.agent,
      retrieveCredentials,
      configurationId,
      setErrorReasonWithError,
      paradym.logger.error,
    ]
  )

  const parsePresentationRequestUrl = useCallback(
    (oid4vpRequestUrl: string) =>
      getCredentialsForProofRequest({
        paradym,
        uri: oid4vpRequestUrl,
      })
        .then(setCredentialsForRequest)
        .catch((error) => {
          setErrorReasonWithError('Presentation information could not be extracted.', error)
          paradym.logger.error('Error getting credentials for request', {
            error,
          })
        }),
    [paradym, setErrorReasonWithError, paradym.logger.error]
  )

  const onCheckCardContinue = useCallback(async () => {
    if (preAuthGrant && !preAuthGrant.tx_code) {
      await acquireCredentialsPreAuth()
    }
    if (resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance) {
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
        setErrorReason('Presentation information could not be extracted.')
        return
      }

      setIsSharingPresentation(true)

      if (shouldUsePinForPresentation) {
        if (!pin) {
          setErrorReason('PIN is required to accept the presentation.')
          return
        }
        // TODO: maybe provide to shareProof method?
        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (error) {
          if (error instanceof InvalidPinError) {
            onPinError?.()
            setIsSharingPresentation(false)
            toast.show('Invalid PIN entered', { customData: { preset: 'warning' } })
            return
          }

          setErrorReasonWithError('Presentation information could not be extracted', error)
          return
        }
      }

      try {
        const { presentationDuringIssuanceSession } = await shareProof({
          paradym,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
          fetchBatchCredentialCallback: refreshPid,
        })

        const { authorizationCode } = await acquireAuthorizationCodeUsingPresentation({
          resolvedCredentialOffer,
          authSession: resolvedAuthorizationRequest.authSession,
          presentationDuringIssuanceSession,
          agent: paradym.agent,
        })

        await acquireCredentialsAuth(authorizationCode)
        onPinComplete?.()
        setIsSharingPresentation(false)
      } catch (error) {
        setIsSharingPresentation(false)
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setErrorReason('Biometric authentication cancelled')
          return
        }
        if (error instanceof InvalidPinError) {
          onPinError?.()
          toast.show('Invalid PIN entered', { customData: { preset: 'warning' } })
          return
        }

        paradym.logger.error('Error accepting presentation', {
          error,
        })
        setErrorReasonWithError('Presentation could not be shared.', error)
      }
    },
    [
      credentialsForRequest,
      paradym,
      acquireCredentialsAuth,
      resolvedAuthorizationRequest,
      resolvedCredentialOffer,
      shouldUsePinForPresentation,
      toast.show,
      setErrorReasonWithError,
      paradym.logger.error,
    ]
  )

  const onCancel = () => pushToWallet('back')
  const onGoToWallet = () => pushToWallet('replace')

  const isAuthFlow =
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.PresentationDuringIssuance &&
    credentialsForRequest

  const isPreAuthWithTxFlow = preAuthGrant && txCode

  const isBrowserAuthFlow =
    resolvedCredentialOffer &&
    resolvedAuthorizationRequest?.authorizationFlow === OpenId4VciAuthorizationFlow.Oauth2Redirect

  // These are callbacks to not change on every render
  const onCancelAuthorization = useCallback(() => setErrorReason('Authorization cancelled'), [])
  const onErrorAuthorization = useCallback(() => setErrorReason('Authorization failed'), [])

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
                    redirectUri: authorization.redirectUri,
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
                  onDecline={onProofDecline}
                  logo={credentialsForRequest.verifier.logo}
                  submission={credentialsForRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  // Not supported for this flow atm
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
              isCompleted={isCompleted}
              onAccept={onCompleteCredentialRetrieval}
            />
          ),
        },
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined)}
      errorScreen={() => (
        <InteractionErrorSlide key="credential-error" flowType="issue" reason={errorReason} onCancel={onCancel} />
      )}
      isError={errorReason !== undefined}
      onCancel={onProofDecline}
      confirmation={{
        title: 'Stop card offer?',
        description: 'If you stop, the card offer will be cancelled.',
      }}
    />
  )
}
