import { walletClient } from '@easypid/constants'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { refreshPidIfNeeded } from '@easypid/use-cases/RefreshPidUseCase'
import { useLingui } from '@lingui/react/macro'
import { SlideWizard, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialForDisplay } from '@paradym/wallet-sdk/display/credential'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import type { ResolveCredentialOfferReturn } from '@paradym/wallet-sdk/invitation/resolver'
import type { DeferredCredentialBefore } from '@paradym/wallet-sdk/storage/deferredCredentialStore'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { type onPinSubmitProps, PinSlide } from '../share/slides/PinSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { AuthCodeFlowSlide } from './slides/AuthCodeFlowSlide'
import { CredentialCardSlide } from './slides/CredentialCardSlide'
import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { InteractionErrorSlide } from './slides/InteractionErrorSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'
import { TxCodeSlide } from './slides/TxCodeSlide'
import { VerifyPartySlide } from './slides/VerifyPartySlide'

type Query = { uri: string }

export function FunkeCredentialNotificationScreen() {
  const { paradym } = useParadym('unlocked')

  const params = useLocalSearchParams<Query>()
  const toast = useToastController()

  const { t } = useLingui()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSharingPresentation, setIsSharingPresentation] = useState(false)

  const [resolvedOffer, setResolvedOffer] = useState<ResolveCredentialOfferReturn>()
  const [deferredCredential, setDeferredCredential] = useState<DeferredCredentialBefore>()

  const [receivedCredential, setReceivedCredential] = useState<CredentialForDisplay>()

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

  const shouldUsePinForPresentation = useShouldUsePinForSubmission(
    resolvedOffer?.flow === 'auth-presentation-during-issuance'
      ? resolvedOffer.credentialsForProofRequest.formattedSubmission
      : undefined
  )

  useEffect(() => {
    if (resolvedOffer) return

    paradym.openid4vc
      .resolveCredentialOffer({
        offerUri: params.uri,
        authorization: walletClient,
      })
      .then((result) => {
        setResolvedOffer(result)
      })
      .catch((error) => {
        setErrorReasonWithError(t(commonMessages.credentialInformationCouldNotBeExtracted), error)
        paradym.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [params.uri, paradym, setErrorReasonWithError, t])

  const onPresentationAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: onPinSubmitProps = {}) => {
      if (resolvedOffer?.flow !== 'auth-presentation-during-issuance') {
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
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (error) {
          if (error instanceof InvalidPinError) {
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
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          authorization: walletClient,
          resolvedCredentialOffer: resolvedOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedOffer.resolvedAuthorizationRequest,
          credentialsForRequest: resolvedOffer.credentialsForProofRequest,
          refreshCredentialsCallback: refreshPidIfNeeded,
        })

        onPinComplete?.()

        updateCredentials(acquiredCredentials)
      } catch (error) {
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setErrorReason(t(commonMessages.biometricAuthenticationCancelled))
          return
        }
        if (error instanceof InvalidPinError) {
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
    [t, paradym, shouldUsePinForPresentation, toast.show, setErrorReasonWithError, paradym.logger.error, resolvedOffer]
  )

  // These are callbacks to not change on every render
  const onCancelAuthorization = useCallback(
    () => setErrorReason(t({ id: 'browserAuthFlow.authorizationCancelled', message: 'Authorization cancelled' })),
    [t]
  )

  const onErrorAuthorization = useCallback(() => setErrorReason(t(commonMessages.authorizationFailed)), [t])

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (resolvedOffer?.flow !== 'auth' && resolvedOffer?.flow !== 'auth-presentation-during-issuance') {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired later when presentation is done
      if (resolvedOffer?.flow === 'auth-presentation-during-issuance') return

      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedOffer.resolvedAuthorizationRequest,
          authorizationCode,
          authorization: walletClient,
          refreshCredentialsCallback: refreshPidIfNeeded,
        })

        updateCredentials(acquiredCredentials)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [paradym, setErrorReasonWithError, t, resolvedOffer]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (resolvedOffer?.flow !== 'pre-auth-with-tx-code' && resolvedOffer?.flow !== 'pre-auth') {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired when the txCode is entered on the next screen
      if (resolvedOffer.flow === 'pre-auth-with-tx-code' && !txCode) return

      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedOffer.resolvedCredentialOffer,
          transactionCode: txCode,
          refreshCredentialsCallback: refreshPidIfNeeded,
        })

        updateCredentials(acquiredCredentials)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [paradym, setErrorReasonWithError, t, resolvedOffer]
  )

  const onCompleteCredentialRetrieval = async () => {
    await paradym.openid4vc.completeCredentialRetrieval({
      resolvedCredentialOffer: resolvedOffer?.resolvedCredentialOffer,
      record: receivedCredential?.record,
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

  // TODO: it is not the cleanest, but the UI shows it perfectly.
  //       This is done to make sure we have a defined `resolvedOffer` in all the next steps
  //       Do we want to keep it like this? Or is there a better way where the rest of slides has it defined
  if (!resolvedOffer) {
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
      />
    )
  }

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!resolvedOffer} isError={!!errorReason} />,
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={resolvedOffer.credentialDisplay.issuer.name}
              logo={resolvedOffer.credentialDisplay.issuer.logo}
              entityId={resolvedOffer.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer}
              onContinue={
                resolvedOffer.flow === 'pre-auth' || resolvedOffer.flow === 'pre-auth-with-tx-code'
                  ? acquireCredentialsPreAuth
                  : undefined
              }
            />
          ),
        },
        resolvedOffer.flow === 'auth'
          ? {
              step: 'auth-code-flow',
              progress: 49.5,
              backIsCancel: true,
              screen: (
                <AuthCodeFlowSlide
                  key="auth-code-flow"
                  display={resolvedOffer.credentialDisplay}
                  authCodeFlowDetails={{
                    openUrl: resolvedOffer.resolvedAuthorizationRequest.authorizationRequestUrl,
                    redirectUri: walletClient.redirectUri,
                    domain: resolvedOffer.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer,
                  }}
                  onAuthFlowCallback={acquireCredentialsAuth}
                  onCancel={onCancelAuthorization}
                  onError={onErrorAuthorization}
                />
              ),
            }
          : resolvedOffer.flow === 'auth-presentation-during-issuance'
            ? {
                step: 'check-card',
                progress: 49.5,
                screen: (
                  <CredentialCardSlide
                    key="credential-card"
                    type="presentation"
                    display={resolvedOffer.credentialDisplay}
                  />
                ),
              }
            : {
                step: 'check-card',
                progress: 49.5,
                screen: (
                  <CredentialCardSlide
                    key="credential-card"
                    type={resolvedOffer.flow === 'pre-auth-with-tx-code' ? 'pin' : 'noAuth'}
                    display={resolvedOffer.credentialDisplay}
                  />
                ),
              },
        resolvedOffer.flow === 'auth-presentation-during-issuance'
          ? {
              step: 'presentation-during-issuance',
              progress: 66,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="share-credentials"
                  onAccept={shouldUsePinForPresentation ? undefined : onPresentationAccept}
                  logo={resolvedOffer.credentialsForProofRequest.verifier.logo}
                  submission={resolvedOffer.credentialsForProofRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  onDecline={onProofDecline}
                  // Not supported for this flow atm
                  overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
                />
              ),
            }
          : undefined,
        resolvedOffer.flow === 'auth-presentation-during-issuance' && shouldUsePinForPresentation
          ? {
              step: 'pin-enter',
              progress: 82.5,
              screen: <PinSlide key="pin-enter" isLoading={isSharingPresentation} onPinSubmit={onPresentationAccept} />,
            }
          : undefined,
        resolvedOffer.flow === 'pre-auth-with-tx-code'
          ? {
              step: 'tx-code',
              progress: 66,
              backIsCancel: true,
              screen: <TxCodeSlide txCode={resolvedOffer.txCodeInfo} onTxCode={acquireCredentialsPreAuth} />,
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
              deferred={!!deferredCredential}
              display={resolvedOffer.credentialDisplay}
              attributes={receivedCredential?.attributes ?? {}}
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
