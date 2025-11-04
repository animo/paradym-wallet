import { InvalidPinError } from '@easypid/crypto/error'
import { useOverAskingAi } from '@easypid/hooks'
import { useDevelopmentMode } from '@easypid/hooks'
import { refreshPid } from '@easypid/use-cases/RefreshPidUseCase'
import { useLingui } from '@lingui/react/macro'
import { usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { getDisclosedAttributeNamesForDisplay } from '@paradym/wallet-sdk/display/common'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import type { FormattedSubmissionEntrySatisfied } from '@paradym/wallet-sdk/format/submission'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import type { CredentialsForProofRequest } from '@paradym/wallet-sdk/openid4vc/getCredentialsForProofRequest'
import { type FormattedTransactionData, getFormattedTransactionData } from '@paradym/wallet-sdk/openid4vc/transaction'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { onPinSubmitProps } from './slides/PinSlide'

type Query = { uri: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { t } = useLingui()
  const { paradym } = useParadym('unlocked')

  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()

  const [resolvedRequest, setResolvedRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [isSharing, setIsSharing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(resolvedRequest?.formattedSubmission)

  const handleError = useCallback(({ reason, description }: { reason: string; description?: string }) => {
    setIsSharing(false)
    setErrorReason(description ? `${reason}\n${description}` : reason)
    return
  }, [])

  const reasonNoCredentials = t({
    id: 'presentation.noCredentialsSelected',
    message: 'No credentials selected',
    comment: 'Shown when the user tries to accept a proof but no credentials are loaded',
  })

  const reasonPinAuthFailed = t({
    id: 'presentation.pinAuthFailed',
    message: 'PIN authentication failed',
    comment: 'Shown when PIN is required but not provided',
  })

  const reasonAuthFailed = t({
    id: 'presentation.authFailed',
    message: 'Authentication failed',
    comment: 'Shown when authentication with PIN fails for other reasons',
  })

  useEffect(() => {
    if (resolvedRequest) return

    paradym.openid4vc
      .resolveCredentialRequest({
        uri: params.uri,
      })
      .then((r) => {
        setResolvedRequest(r)
        return r
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined

        handleError({
          reason: t(commonMessages.presentationInformationCouldNotBeExtracted),
          description: errorMessage,
        })
      })
      .then((r) => {
        if (r) setFormattedTransactionData(getFormattedTransactionData(r))
      })
      .catch((error) => {
        handleError({ reason: error.message })
      })
  }, [resolvedRequest, params.uri, paradym.openid4vc, isDevelopmentModeEnabled, handleError, t])

  const { checkForOverAsking, isProcessingOverAsking, overAskingResponse, stopOverAsking } = useOverAskingAi()

  useEffect(() => {
    if (!resolvedRequest?.formattedSubmission || !resolvedRequest?.formattedSubmission.areAllSatisfied) {
      return
    }

    if (isProcessingOverAsking || overAskingResponse) {
      // Already generating or already has result
      return
    }

    const submission = resolvedRequest.formattedSubmission
    const requestedCards = submission.entries
      .filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
      .flatMap((entry) => entry.credentials)

    void checkForOverAsking({
      verifier: {
        name: resolvedRequest.verifier.name ?? 'No name provided',
        domain: resolvedRequest.verifier.hostName ?? 'No domain provided',
      },
      name: submission.name ?? 'No name provided',
      purpose: submission.purpose ?? 'No purpose provided',
      cards: requestedCards.map((credential) => ({
        name: credential.credential.display.name ?? 'Card name',
        subtitle: credential.credential.display.description ?? 'Card description',
        requestedAttributes: getDisclosedAttributeNamesForDisplay(credential),
      })),
    })
  }, [resolvedRequest, checkForOverAsking, isProcessingOverAsking, overAskingResponse])

  const onProofAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: onPinSubmitProps = {}) => {
      stopOverAsking()
      if (!resolvedRequest) return handleError({ reason: reasonNoCredentials })

      setIsSharing(true)

      if (shouldUsePin) {
        if (!pin) {
          setIsSharing(false)
          return handleError({ reason: reasonPinAuthFailed })
        }

        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          setIsSharing(false)
          if (e instanceof InvalidPinError) {
            onPinError?.()
            toast.show(t(commonMessages.invalidPinEntered), {
              customData: {
                preset: 'danger',
              },
            })
            return
          }

          return handleError({
            reason: reasonAuthFailed,
            description:
              e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
          })
        }
      }

      try {
        await paradym.openid4vc.shareCredentials({
          resolvedRequest,
          selectedCredentialsForRequest: {},
          fetchBatchCredentialCallback: refreshPid,
          acceptTransactionData: formattedTransactionData?.type === 'qes_authorization',
        })

        onPinComplete?.()
      } catch (error) {
        setIsSharing(false)
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          return handleError({
            reason: t(commonMessages.biometricAuthenticationCancelled),
          })
        }

        return handleError({
          reason: t(commonMessages.presentationCouldNotBeShared),
          description:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
        })
      }
    },
    [
      resolvedRequest,
      paradym,
      shouldUsePin,
      stopOverAsking,
      toast,
      isDevelopmentModeEnabled,
      handleError,
      formattedTransactionData,
      reasonNoCredentials,
      reasonPinAuthFailed,
      t,
      reasonAuthFailed,
    ]
  )

  const onProofDecline = useCallback(async () => {
    stopOverAsking()
    if (resolvedRequest) {
      await paradym.openid4vc.declineCredentialRequest({ resolvedRequest })
    }

    pushToWallet()
    toast.show(t(commonMessages.informationRequestDeclined), {
      customData: { preset: 'danger' },
    })
  }, [resolvedRequest, pushToWallet, stopOverAsking, t, toast, paradym])

  const replace = useCallback(() => pushToWallet('replace'), [pushToWallet])

  return (
    <FunkePresentationNotificationScreen
      key="presentation"
      usePin={shouldUsePin ?? false}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={resolvedRequest?.formattedSubmission}
      isAccepting={isSharing}
      entityId={resolvedRequest?.verifier.entityId}
      verifierName={resolvedRequest?.verifier.name}
      logo={resolvedRequest?.verifier.logo}
      trustedEntities={resolvedRequest?.verifier.trustedEntities}
      trustMechanism={resolvedRequest?.trustMechanism}
      onComplete={replace}
      onCancel={replace}
      overAskingResponse={overAskingResponse}
      transaction={formattedTransactionData}
      errorReason={errorReason}
    />
  )
}
