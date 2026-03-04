import { walletClient } from '@easypid/constants'
import { useDevelopmentMode } from '@easypid/hooks'
import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import { useLingui } from '@lingui/react/macro'
import { SlideWizard, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { CredentialForDisplay, DeferredCredentialBefore, ResolveCredentialOfferReturn } from '@paradym/wallet-sdk'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  useParadym,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { type OnPinSubmitProps, PinSlide } from '../share/slides/PinSlide'
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

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<ResolveCredentialOfferReturn>()
  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [deferredCredential, setDeferredCredential] = useState<DeferredCredentialBefore>()
  const [receivedCredential, setReceivedCredential] = useState<CredentialForDisplay>()

  const shouldUsePinForPresentation = useShouldUsePinForSubmission(
    resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance'
      ? resolvedCredentialOffer.credentialsForProofRequest.formattedSubmission
      : undefined
  )

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

  useEffect(() => {
    paradym.openid4vc
      .resolveCredentialOffer({
        offerUri: params.uri,
        authorization: walletClient,
      })
      .then((result) => {
        setResolvedCredentialOffer(result)
      })
      .catch((error) => {
        setErrorReasonWithError(t(commonMessages.credentialInformationCouldNotBeExtracted), error)
        paradym.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [params.uri, paradym, setErrorReasonWithError, t])

  const onPresentationAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: OnPinSubmitProps = {}) => {
      if (resolvedCredentialOffer?.flow !== 'auth-presentation-during-issuance') {
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
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          authorization: walletClient,
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedCredentialOffer.resolvedAuthorizationRequest,
          credentialsForRequest: resolvedCredentialOffer.credentialsForProofRequest,
        })

        onPinComplete?.()

        updateCredentials(acquiredCredentials)
      } catch (error) {
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setErrorReason(t(commonMessages.biometricAuthenticationCancelled))
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
    ]
  )

  // These are callbacks to not change on every render
  const onCancelAuthorization = useCallback(
    () => setErrorReason(t({ id: 'browserAuthFlow.authorizationCancelled', message: 'Authorization cancelled' })),
    [t]
  )

  const onErrorAuthorization = useCallback(() => setErrorReason(t(commonMessages.authorizationFailed)), [t])

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
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [paradym, setErrorReasonWithError, t, resolvedCredentialOffer]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (resolvedCredentialOffer?.flow !== 'pre-auth-with-tx-code' && resolvedCredentialOffer?.flow !== 'pre-auth') {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired when the txCode is entered on the next screen
      if (resolvedCredentialOffer.flow === 'pre-auth-with-tx-code' && !txCode) return

      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          transactionCode: txCode,
        })

        updateCredentials(acquiredCredentials)
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, {
          error,
        })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      }
    },
    [paradym, setErrorReasonWithError, t, resolvedCredentialOffer]
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
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={resolvedCredentialOffer.credentialDisplay.issuer.name}
              logo={resolvedCredentialOffer.credentialDisplay.issuer.logo}
              entityId={resolvedCredentialOffer.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer}
              onContinue={
                resolvedCredentialOffer.flow === 'pre-auth' || resolvedCredentialOffer.flow === 'pre-auth-with-tx-code'
                  ? acquireCredentialsPreAuth
                  : undefined
              }
            />
          ),
        },
        resolvedCredentialOffer.flow === 'auth'
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
                  onCancel={onCancelAuthorization}
                  onError={onErrorAuthorization}
                />
              ),
            }
          : resolvedCredentialOffer.flow === 'auth-presentation-during-issuance'
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
            : {
                step: 'check-card',
                progress: 49.5,
                screen: (
                  <CredentialCardSlide
                    key="credential-card"
                    type={resolvedCredentialOffer.flow === 'pre-auth-with-tx-code' ? 'pin' : 'noAuth'}
                    display={resolvedCredentialOffer.credentialDisplay}
                  />
                ),
              },
        resolvedCredentialOffer.flow === 'auth-presentation-during-issuance' && shouldUsePinForPresentation
          ? {
              step: 'presentation-during-issuance',
              progress: 66,
              backIsCancel: true,
              screen: (
                <ShareCredentialsSlide
                  key="share-credentials"
                  onAccept={shouldUsePinForPresentation ? undefined : onPresentationAccept}
                  logo={resolvedCredentialOffer.credentialsForProofRequest.verifier.logo}
                  submission={resolvedCredentialOffer.credentialsForProofRequest.formattedSubmission}
                  isAccepting={isSharingPresentation}
                  onDecline={onProofDecline}
                  // Not supported for this flow atm
                  overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
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
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={resolvedCredentialOffer.credentialDisplay}
              attributes={receivedCredential?.attributes ?? []}
              deferred={deferredCredential !== undefined}
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
