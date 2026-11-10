import { isHardwareBoundCredentialConfiguration } from '@app/config/paymentAttestation'
import { walletClient } from '@app/constants'
import { useDevelopmentMode } from '@app/hooks'
import { dcApiRegisterOptions } from '@app/utils/dcApiRegisterOptions'
import { useLingui } from '@lingui/react/macro'
import { SlideWizard, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type {
  CredentialForDisplay,
  CredentialsForProofRequest,
  DeferredCredentialBefore,
  ResolveCredentialOfferReturn,
} from '@paradym/wallet-sdk'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
  ParadymWalletInvalidTransactionCodeError,
  selectSubmissionCredentials,
  useParadym,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { validateWalletPin } from '../../crypto/walletPin'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { type OnPinSubmitProps, PinSlide } from '../share/slides/PinSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { getPushedAuthorizationPresentationRequestUri } from './issuanceAuthorizationPresentationRequest'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { BiometricsRequiredSlide, canCreateHardwareBoundKey } from './slides/BiometricsRequiredSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { InteractionErrorSlide } from './slides/InteractionErrorSlide'
import { InvalidTxCodeSlide } from './slides/InvalidTxCodeSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri: string }

// The authorization code in a redirect to the wallet's own redirect uri
function getWalletRedirectAuthorizationCode(redirectUri: string) {
  const url = new URL(redirectUri)
  const walletRedirectUrl = new URL(walletClient.redirectUri)
  const isWalletRedirect =
    url.protocol === walletRedirectUrl.protocol &&
    url.host === walletRedirectUrl.host &&
    url.pathname === walletRedirectUrl.pathname

  return isWalletRedirect ? (url.searchParams.get('code') ?? undefined) : undefined
}

export function CredentialNotificationScreen() {
  const { paradym } = useParadym('unlocked')

  const params = useLocalSearchParams<Query>()
  const toast = useToastController()

  const { t } = useLingui()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [isInvalidTxCode, setIsInvalidTxCode] = useState(false)
  const [txCodeAttempts, setTxCodeAttempts] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  const maxTxCodeAttempts = 3

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<ResolveCredentialOfferReturn>()
  const [isBiometricsSetupRequired, setIsBiometricsSetupRequired] = useState(false)
  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [deferredCredential, setDeferredCredential] = useState<DeferredCredentialBefore>()
  const [receivedCredential, setReceivedCredential] = useState<CredentialForDisplay>()
  // The presentation the authorization server requests from the browser in the authorization code flow,
  // and the redirect_uri the verifier returns to continue the authorization in the browser after sharing.
  const [authorizationPresentationRequest, setAuthorizationPresentationRequest] = useState<CredentialsForProofRequest>()
  const [authorizationPresentationRedirectUri, setAuthorizationPresentationRedirectUri] = useState<string>()

  const requestedPresentation =
    resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance'
      ? resolvedCredentialOffer.credentialsForProofRequest
      : authorizationPresentationRequest
  // The cards the user picked, by entry, where more than one matches. The first card of every entry is
  // the one shared.
  const [selectedCredentials, setSelectedCredentials] = useState<Record<string, string>>({})
  const presentationRequest = requestedPresentation && {
    ...requestedPresentation,
    formattedSubmission: selectSubmissionCredentials(requestedPresentation.formattedSubmission, selectedCredentials),
  }
  const onSelectCredential = (inputDescriptorId: string, credentialRecordId: string) =>
    setSelectedCredentials((selected) => ({ ...selected, [inputDescriptorId]: credentialRecordId }))
  const shouldUsePinForPresentation = useShouldUsePinForSubmission(presentationRequest?.formattedSubmission)
  // The authorization server returned the presentation request from the pushed authorization request, so there's
  // no need to open the browser to start the authorization
  const hasPushedPresentationRequest =
    resolvedCredentialOffer?.flow === 'auth' &&
    getPushedAuthorizationPresentationRequestUri(
      resolvedCredentialOffer.resolvedAuthorizationRequest.authorizationRequestUrl
    ) !== undefined

  const onCancel = () => pushToWallet()
  const onGoToWallet = () => pushToWallet()

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

  // A hardware bound card needs a biometric to create its key and sign with it, and saying so is more
  // useful than the generic reason.
  const setIssuanceErrorReason = useCallback(
    (error: unknown) => {
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        setErrorReason(t(commonMessages.biometricAuthenticationCancelled))
      } else if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
        setErrorReason(t(commonMessages.biometricAuthenticationMustBeEnabledInSettings))
      } else {
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [setErrorReasonWithError, t]
  )

  const onAuthorizationPresentationRequest = useCallback(
    async (requestUri: string) => {
      try {
        setAuthorizationPresentationRequest(await paradym.openid4vc.resolveCredentialRequest({ uri: requestUri }))
      } catch (error) {
        paradym.logger.error('Error resolving presentation request during authorization', { error })
        setErrorReasonWithError(t(commonMessages.presentationInformationCouldNotBeExtracted), error)
      }
    },
    [paradym, setErrorReasonWithError, t]
  )

  // The authorization challenge / presentation request_uri the issuer hands us during
  // resolve is one-shot on the server side, so re-firing this effect would 404 the second call.
  const resolvingOfferUriRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (resolvingOfferUriRef.current === params.uri) return
    resolvingOfferUriRef.current = params.uri

    paradym.openid4vc
      .resolveCredentialOffer({
        offerUri: params.uri,
        authorization: walletClient,
      })
      .then(async (result) => {
        // Checked up front: otherwise the user goes through the whole issuer flow, only for the key to
        // fail to be created once the card is requested.
        const credentialConfiguration = Object.values(result.resolvedCredentialOffer.offeredCredentialConfigurations)[0]
        if (credentialConfiguration && (await isHardwareBoundCredentialConfiguration(credentialConfiguration))) {
          setIsBiometricsSetupRequired(!(await canCreateHardwareBoundKey()))
        }

        const pushedPresentationRequestUri =
          result.flow === 'auth'
            ? getPushedAuthorizationPresentationRequestUri(result.resolvedAuthorizationRequest.authorizationRequestUrl)
            : undefined
        if (pushedPresentationRequestUri) await onAuthorizationPresentationRequest(pushedPresentationRequestUri)

        setResolvedCredentialOffer(result)
      })
      .catch((error) => {
        setErrorReasonWithError(t(commonMessages.credentialInformationCouldNotBeExtracted), error)
        paradym.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [params.uri, paradym, setErrorReasonWithError, t, onAuthorizationPresentationRequest])

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (
        resolvedCredentialOffer?.flow !== 'auth' &&
        resolvedCredentialOffer?.flow !== 'auth-presentation-during-issuance'
      ) {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired later when presentation is done
      if (resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance') return

      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedCredentialOffer.resolvedAuthorizationRequest,
          authorizationCode,
          authorization: walletClient,
        })

        updateCredentials(acquiredCredentials)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setIssuanceErrorReason(error)
      }
    },
    [paradym, setIssuanceErrorReason, t, resolvedCredentialOffer]
  )

  const onPresentationAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: OnPinSubmitProps = {}) => {
      if (!resolvedCredentialOffer || !presentationRequest) {
        setErrorReason(t(commonMessages.presentationInformationCouldNotBeExtracted))
        return
      }

      setIsSharingPresentation(true)

      if (shouldUsePinForPresentation) {
        if (!pin) {
          setErrorReason('PIN is required to accept the presentation.')
          return
        }
        try {
          await validateWalletPin(pin)
        } catch (error) {
          if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
            onPinError?.()
            setIsSharingPresentation(false)
            toast.show(t(commonMessages.invalidPinEntered), { customData: { preset: 'warning' } })
            return
          }

          setErrorReasonWithError(t(commonMessages.presentationInformationCouldNotBeExtracted), error)
          return
        }
      }

      try {
        if (resolvedCredentialOffer.flow === 'auth-presentation-during-issuance') {
          const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
            authorization: walletClient,
            resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
            resolvedAuthorizationRequest: resolvedCredentialOffer.resolvedAuthorizationRequest,
            credentialsForRequest: presentationRequest,
          })

          onPinComplete?.()

          updateCredentials(acquiredCredentials)
        } else {
          const { redirectUri } = await paradym.openid4vc.shareCredentials({
            resolvedRequest: presentationRequest,
            selectedCredentials: {},
            openRedirectUri: false,
          })
          if (!redirectUri) {
            throw new Error('The verifier did not return a redirect_uri to continue the authorization')
          }

          // Otherwise the authorization continues in the browser at the redirect_uri, which then redirects
          // back with the authorization code. That's opened from the next step, so the result comes back here.
          setAuthorizationPresentationRedirectUri(redirectUri)
          onPinComplete?.()

          // The authorization server can return the authorization code in the redirect_uri to the wallet
          // right away, which saves opening the browser again.
          const authorizationCode = getWalletRedirectAuthorizationCode(redirectUri)
          if (authorizationCode) void acquireCredentialsAuth(authorizationCode)
        }
      } catch (error) {
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setErrorReason(t(commonMessages.biometricAuthenticationCancelled))
          return
        }
        if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
          setErrorReason(t(commonMessages.biometricAuthenticationMustBeEnabledInSettings))
          return
        }
        if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
          onPinError?.()
          toast.show(t(commonMessages.invalidPinEntered), { customData: { preset: 'warning' } })
          return
        }

        paradym.logger.error('Error accepting presentation', {
          error,
        })
        setErrorReasonWithError(t(commonMessages.presentationCouldNotBeShared), error)
      } finally {
        setIsSharingPresentation(false)
      }
    },
    [
      t,
      paradym,
      shouldUsePinForPresentation,
      toast.show,
      setErrorReasonWithError,
      paradym.logger.error,
      resolvedCredentialOffer,
      presentationRequest,
      acquireCredentialsAuth,
    ]
  )

  // These are callbacks to not change on every render
  const onCancelAuthorization = useCallback(() => setErrorReason(t(commonMessages.authorizationCancelled)), [t])

  const onErrorAuthorization = useCallback(() => setErrorReason(t(commonMessages.authorizationFailed)), [t])

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string): Promise<boolean> => {
      if (resolvedCredentialOffer?.flow !== 'pre-auth-with-tx-code' && resolvedCredentialOffer?.flow !== 'pre-auth') {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return true
      }

      // Credentials will be acquired when the txCode is entered on the next screen
      if (resolvedCredentialOffer.flow === 'pre-auth-with-tx-code' && !txCode) return true

      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          transactionCode: txCode,
        })

        updateCredentials(acquiredCredentials)
        return true
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        if (error instanceof ParadymWalletInvalidTransactionCodeError) {
          const nextAttempts = txCodeAttempts + 1
          setTxCodeAttempts(nextAttempts)
          if (nextAttempts >= maxTxCodeAttempts) {
            setIsInvalidTxCode(true)
            return true
          }
          toast.show(
            t({
              id: 'invalidTxCode.toast',
              message: 'Incorrect transaction code. Please try again.',
              comment: 'Toast shown when a wrong transaction code was entered and the user can still retry',
            }),
            { customData: { preset: 'warning' } }
          )
          return false
        }
        setIssuanceErrorReason(error)
        return true
      }
    },
    [paradym, setIssuanceErrorReason, t, resolvedCredentialOffer, txCodeAttempts, toast.show]
  )

  const onCompleteCredentialRetrieval = async () => {
    await paradym.openid4vc.completeCredentialRetrieval({
      resolvedCredentialOffer: resolvedCredentialOffer?.resolvedCredentialOffer,
      recordToStore: receivedCredential
        ? dcApiRegisterOptions({ paradym, credentialRecord: receivedCredential.record })
        : undefined,
      deferredCredential,
    })

    setIsCompleted(true)
  }

  const updateCredentials = (options: {
    deferredCredentials: DeferredCredentialBefore[]
    credentials: CredentialForDisplay[]
  }) => {
    if (options.deferredCredentials.length > 0 && options.credentials.length > 0) {
      setErrorReasonWithError(
        t(commonMessages.credentialInformationCouldNotBeExtracted),
        new Error('Received both immediate and deferred credentials')
      )
      paradym.logger.error('Received both immediate and deferred credentials in OpenID4VCI response')
      return
    }

    if (options.deferredCredentials.length) {
      setDeferredCredential(options.deferredCredentials[0])
    }

    if (options.credentials.length) {
      setReceivedCredential(options.credentials[0])
    }
  }

  const onProofDecline = async () => {
    toast.show(t(commonMessages.informationRequestDeclined), { customData: { preset: 'danger' } })
    pushToWallet()
  }

  const onOfferDecline = () => {
    toast.show(t(commonMessages.credentialDeclined))
    pushToWallet()
  }

  // TODO: it is not the cleanest, but the UI shows it perfectly.
  //       This is done to make sure we have a defined `resolvedOffer` in all the next steps
  //       Do we want to keep it like this? Or is there a better way where the rest of slides has it defined
  if (!resolvedCredentialOffer) {
    return (
      <SlideWizard
        steps={[
          {
            step: 'loading-request',
            progress: 16.5,
            screen: <LoadingRequestSlide key="loading-request" isLoading={true} isError={!!errorReason} />,
          },
        ]}
        onCancel={onCancel}
        errorScreen={() => (
          <InteractionErrorSlide key="credential-error" flowType="issue" reason={errorReason} onCancel={onCancel} />
        )}
        isError={errorReason !== undefined}
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
        isBiometricsSetupRequired
          ? {
              step: 'biometrics-required',
              progress: 25,
              backIsCancel: true,
              screen: <BiometricsRequiredSlide key="biometrics-required" />,
            }
          : undefined,
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          // Without a card step after it, the next step is retrieving the card, which lays out its own wide window,
          // so this step lays out its own as well
          combineWithNext: resolvedCredentialOffer.flow !== 'pre-auth',
          ownsWideLayout: resolvedCredentialOffer.flow === 'pre-auth',
          scrollsOwnContent: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={resolvedCredentialOffer.issuer.organizationName}
              logo={{ url: resolvedCredentialOffer.issuer.logoUri, altText: resolvedCredentialOffer.issuer.entityId }}
              entityId={resolvedCredentialOffer.issuer.entityId}
              onContinue={
                // With a transaction code, the card is requested once the code is entered
                resolvedCredentialOffer.flow === 'pre-auth'
                  ? async () => {
                      // Not awaited: the next step shows a loader until the card is there
                      void acquireCredentialsPreAuth()
                    }
                  : undefined
              }
              trustedEntities={resolvedCredentialOffer.trustedEntities}
              isBeyondRegistration={resolvedCredentialOffer.issuerRegistration?.valid === false}
            />
          ),
        },
        resolvedCredentialOffer.flow === 'auth' && !hasPushedPresentationRequest
          ? {
              step: 'auth-code-flow',
              progress: 49.5,
              backIsCancel: true,
              screen: (
                <AuthCodeFlowSlide
                  key="auth-code-flow"
                  display={resolvedCredentialOffer.credentialDisplay}
                  authCodeFlowDetails={{
                    openUrl: resolvedCredentialOffer.resolvedAuthorizationRequest.authorizationRequestUrl,
                    redirectUri: walletClient.redirectUri,
                    domain: resolvedCredentialOffer.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onPresentationRequest={onAuthorizationPresentationRequest}
                  onCancel={onCancelAuthorization}
                  onError={onErrorAuthorization}
                />
              ),
            }
          : resolvedCredentialOffer.flow === 'auth-presentation-during-issuance' || hasPushedPresentationRequest
            ? {
                step: 'check-card',
                progress: 49.5,
                screen: (
                  <CredentialCardSlide
                    key="credential-card"
                    type="presentation"
                    display={resolvedCredentialOffer.credentialDisplay}
                  />
                ),
              }
            : resolvedCredentialOffer.flow === 'pre-auth-with-tx-code'
              ? {
                  step: 'check-card',
                  progress: 49.5,
                  screen: (
                    <CredentialCardSlide
                      key="credential-card"
                      type="pin"
                      display={resolvedCredentialOffer.credentialDisplay}
                    />
                  ),
                }
              : // Pre-auth without a transaction code already gets the card when continuing from the issuer step
                undefined,
        resolvedCredentialOffer.flow === 'auth' && presentationRequest
          ? {
              step: 'authorization-presentation',
              progress: 58,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="authorization-presentation"
                  onAccept={shouldUsePinForPresentation ? undefined : onPresentationAccept}
                  logo={presentationRequest.verifier.logo}
                  submission={presentationRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  onDecline={onProofDecline}
                  onSelectCredential={onSelectCredential}
                />
              ),
            }
          : undefined,
        resolvedCredentialOffer.flow === 'auth' && authorizationPresentationRequest && shouldUsePinForPresentation
          ? {
              step: 'authorization-presentation-pin-enter',
              progress: 66,
              screen: (
                <PinSlide
                  key="authorization-presentation-pin-enter"
                  isLoading={isSharingPresentation}
                  onPinSubmit={onPresentationAccept}
                />
              ),
            }
          : undefined,
        resolvedCredentialOffer.flow === 'auth' &&
        authorizationPresentationRequest &&
        !(
          authorizationPresentationRedirectUri &&
          getWalletRedirectAuthorizationCode(authorizationPresentationRedirectUri)
        )
          ? {
              step: 'auth-code-flow-after-presentation',
              progress: 74,
              backIsCancel: true,
              screen: (
                <AuthCodeFlowSlide
                  key="auth-code-flow-after-presentation"
                  display={resolvedCredentialOffer.credentialDisplay}
                  authCodeFlowDetails={{
                    openUrl: authorizationPresentationRedirectUri ?? '',
                    redirectUri: walletClient.redirectUri,
                    domain: resolvedCredentialOffer.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onCancel={onCancelAuthorization}
                  onError={onErrorAuthorization}
                  autoOpen
                />
              ),
            }
          : undefined,
        resolvedCredentialOffer.flow === 'auth-presentation-during-issuance' &&
        shouldUsePinForPresentation &&
        presentationRequest
          ? {
              step: 'presentation-during-issuance',
              progress: 66,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="share-credentials"
                  onAccept={shouldUsePinForPresentation ? undefined : onPresentationAccept}
                  logo={presentationRequest.verifier.logo}
                  submission={presentationRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  onDecline={onProofDecline}
                  onSelectCredential={onSelectCredential}
                  // Not supported for this flow atm
                />
              ),
            }
          : undefined,
        resolvedCredentialOffer.flow === 'auth-presentation-during-issuance'
          ? {
              step: 'pin-enter',
              progress: 82.5,
              screen: <PinSlide key="pin-enter" isLoading={isSharingPresentation} onPinSubmit={onPresentationAccept} />,
            }
          : undefined,
        resolvedCredentialOffer.flow === 'pre-auth-with-tx-code'
          ? {
              step: 'tx-code',
              progress: 66,
              backIsCancel: true,
              screen: <TxCodeSlide txCode={resolvedCredentialOffer.txCodeInfo} onTxCode={acquireCredentialsPreAuth} />,
            }
          : undefined,

        {
          step: 'retrieve-credential',
          progress: 82.5,
          backIsCancel: true,
          ownsWideLayout: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={resolvedCredentialOffer.credentialDisplay}
              attributes={receivedCredential?.attributes ?? []}
              credential={receivedCredential}
              deferred={deferredCredential !== undefined}
              isCompleted={isCompleted}
              onAccept={onCompleteCredentialRetrieval}
            />
          ),
        },
      ].filter((v): v is Exclude<typeof v, undefined> => v !== undefined)}
      errorScreen={() =>
        isInvalidTxCode ? (
          <InvalidTxCodeSlide key="invalid-tx-code" onCancel={onCancel} />
        ) : (
          <InteractionErrorSlide key="credential-error" flowType="issue" reason={errorReason} onCancel={onCancel} />
        )
      }
      isError={errorReason !== undefined || isInvalidTxCode}
      onCancel={onOfferDecline}
      onComplete={onGoToWallet}
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
