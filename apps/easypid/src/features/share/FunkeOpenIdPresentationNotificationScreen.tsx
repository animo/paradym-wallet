import { InvalidPinError } from '@easypid/crypto/error'
import { useOverAskingAi } from '@easypid/hooks'
import { useDevelopmentMode } from '@easypid/hooks'
import { refreshPid } from '@easypid/use-cases/RefreshPidUseCase'
import { usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { getDisclosedAttributeNamesForDisplay } from '@paradym/wallet-sdk/display/common'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import type { FormattedSubmissionEntrySatisfied } from '@paradym/wallet-sdk/format/submission'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import { shareProof } from '@paradym/wallet-sdk/invitation/shareProof'
import {
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
} from '@paradym/wallet-sdk/openid4vc/getCredentialsForProofRequest'
import { type FormattedTransactionData, getFormattedTransactionData } from '@paradym/wallet-sdk/openid4vc/transaction'
import { addSharedActivityForCredentialsForRequest } from '@paradym/wallet-sdk/storage/activities'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { onPinSubmitProps } from './slides/PinSlide'

type Query = { uri: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()

  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [isSharing, setIsSharing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(credentialsForRequest?.formattedSubmission)

  const handleError = useCallback(({ reason, description }: { reason: string; description?: string }) => {
    setIsSharing(false)
    setErrorReason(description ? `${reason}\n${description}` : reason)
    return
  }, [])

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      paradym,
      uri: params.uri,
    })
      .then((r) => {
        setCredentialsForRequest(r)
        return r
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined

        handleError({ reason: 'Presentation information could not be extracted.', description: errorMessage })

        paradym.logger.error('Error getting credentials for request', {
          error,
        })
        return
      })
      .then((r) => {
        if (r) setFormattedTransactionData(getFormattedTransactionData(r))
      })
      .catch((error) => {
        handleError({ reason: error.message })
      })
  }, [credentialsForRequest, params.uri, paradym, isDevelopmentModeEnabled, handleError])

  const { checkForOverAsking, isProcessingOverAsking, overAskingResponse, stopOverAsking } = useOverAskingAi()

  useEffect(() => {
    if (!credentialsForRequest?.formattedSubmission || !credentialsForRequest?.formattedSubmission.areAllSatisfied) {
      return
    }

    if (isProcessingOverAsking || overAskingResponse) {
      // Already generating or already has result
      return
    }

    const submission = credentialsForRequest.formattedSubmission
    const requestedCards = submission.entries
      .filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
      .flatMap((entry) => entry.credentials)

    void checkForOverAsking({
      verifier: {
        name: credentialsForRequest.verifier.name ?? 'No name provided',
        domain: credentialsForRequest.verifier.hostName ?? 'No domain provided',
      },
      name: submission.name ?? 'No name provided',
      purpose: submission.purpose ?? 'No purpose provided',
      cards: requestedCards.map((credential) => ({
        name: credential.credential.display.name ?? 'Card name',
        subtitle: credential.credential.display.description ?? 'Card description',
        requestedAttributes: getDisclosedAttributeNamesForDisplay(credential),
      })),
    })
  }, [credentialsForRequest, checkForOverAsking, isProcessingOverAsking, overAskingResponse])

  const onProofAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: onPinSubmitProps = {}) => {
      stopOverAsking()
      if (!credentialsForRequest) return handleError({ reason: 'No credentials selected' })

      setIsSharing(true)

      if (shouldUsePin) {
        if (!pin) {
          setIsSharing(false)
          return handleError({ reason: 'PIN authentication failed' })
        }
        // TODO: maybe provide to shareProof method?
        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          setIsSharing(false)
          if (e instanceof InvalidPinError) {
            onPinError?.()
            toast.show('Invalid PIN entered', {
              customData: {
                preset: 'danger',
              },
            })
            return
          }

          return handleError({
            reason: 'Authentication failed',
            description:
              e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
          })
        }
      }

      try {
        await shareProof({
          paradym,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
          fetchBatchCredentialCallback: refreshPid,
          acceptTransactionData: formattedTransactionData?.type === 'qes_authorization',
        })

        onPinComplete?.()
        await addSharedActivityForCredentialsForRequest(
          paradym,
          credentialsForRequest,
          'success',
          formattedTransactionData
        ).catch(console.error)
      } catch (error) {
        setIsSharing(false)
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          return handleError({ reason: 'Biometric authentication cancelled' })
        }

        if (credentialsForRequest) {
          await addSharedActivityForCredentialsForRequest(
            paradym,
            credentialsForRequest,
            'failed',
            formattedTransactionData
          ).catch(console.error)
        }

        paradym.logger.error('Error accepting presentation', {
          error,
        })

        return handleError({
          reason: 'Presentation could not be shared.',
          description:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
        })
      }
    },
    [
      credentialsForRequest,
      paradym,
      shouldUsePin,
      stopOverAsking,
      toast.show,
      isDevelopmentModeEnabled,
      handleError,
      formattedTransactionData,
    ]
  )

  const onProofDecline = async () => {
    stopOverAsking()
    if (credentialsForRequest) {
      await addSharedActivityForCredentialsForRequest(
        paradym,
        credentialsForRequest,
        credentialsForRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
        formattedTransactionData
      ).catch(console.error)
    }

    pushToWallet()
    toast.show('Information request has been declined.', { customData: { preset: 'danger' } })
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={shouldUsePin ?? false}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={credentialsForRequest?.formattedSubmission}
      isAccepting={isSharing}
      entityId={credentialsForRequest?.verifier.entityId}
      verifierName={credentialsForRequest?.verifier.name}
      logo={credentialsForRequest?.verifier.logo}
      trustedEntities={credentialsForRequest?.verifier.trustedEntities}
      trustMechanism={credentialsForRequest?.trustMechanism}
      onComplete={() => pushToWallet('replace')}
      onCancel={() => pushToWallet('replace')}
      overAskingResponse={overAskingResponse}
      transaction={formattedTransactionData}
      errorReason={errorReason}
    />
  )
}
