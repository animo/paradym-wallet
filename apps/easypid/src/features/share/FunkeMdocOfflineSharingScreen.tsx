import { setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { useShouldUsePinForSubmission } from '@easypid/hooks/useShouldUsePinForPresentation'
import { usePushToWallet } from '@package/app'
import { useToastController } from '@package/ui'
import { ParadymWalletBiometricAuthenticationCancelledError } from '@paradym/wallet-sdk/error'
import { getSubmissionForMdocDocumentRequest } from '@paradym/wallet-sdk/format/mdocDocumentRequest'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'
import { useOpenId4VcAgent } from '@paradym/wallet-sdk/hooks'
import { type ActivityStatus, addSharedActivityForCredentialsForRequest } from '@paradym/wallet-sdk/storage/activities'
import { useCallback, useEffect, useState } from 'react'
import { shareDeviceResponse, shutdownDataTransfer } from '../proximity'
import { FunkeOfflineSharingScreen } from './FunkeOfflineSharingScreen'
import type { onPinSubmitProps } from './slides/PinSlide'

type FunkeMdocOfflineSharingScreenProps = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
}

// Entry point for offline sharing with Mdoc
export function FunkeMdocOfflineSharingScreen({
  sessionTranscript,
  deviceRequest,
}: FunkeMdocOfflineSharingScreenProps) {
  const { agent } = useOpenId4VcAgent()
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [submission, setSubmission] = useState<FormattedSubmission>()
  const [isProcessing, setIsProcessing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(submission)

  useEffect(() => {
    getSubmissionForMdocDocumentRequest(agent, deviceRequest)
      .then(setSubmission)
      .catch((error) => {
        toast.show('Presentation information could not be extracted.', {
          message:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for mdoc device request', {
          error,
        })

        pushToWallet()
      })
  }, [agent, deviceRequest, toast.show, pushToWallet, isDevelopmentModeEnabled])

  const handleError = useCallback(
    ({ reason, description, redirect = true }: { reason: string; description?: string; redirect?: boolean }) => {
      toast.show(reason, { message: description, customData: { preset: 'danger' } })
      if (redirect) pushToWallet()
      return
    },
    [toast, pushToWallet]
  )

  const onProofAccept = async ({ pin, onPinComplete, onPinError }: onPinSubmitProps = {}) => {
    // Already checked for submission in the useEffect
    if (!submission) return

    if (shouldUsePin) {
      if (!pin) {
        onPinError?.()
        return
      }

      setIsProcessing(true)

      try {
        await setWalletServiceProviderPin(pin.split('').map(Number))
      } catch (e) {
        setIsProcessing(false)
        if (e instanceof InvalidPinError) {
          onPinError?.()
          return handleError({ reason: 'Invalid PIN entered', redirect: false })
        }

        return handleError({
          reason: 'Authentication Error',
          redirect: true,
          description:
            e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
        })
      }
    }

    // Once this returns we just assume it's successful
    try {
      await shareDeviceResponse({
        agent,
        deviceRequest,
        sessionTranscript,
        submission,
      })
    } catch (error) {
      if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        // Triggers the pin animation
        onPinError?.()
        return handleError({ reason: 'Biometric authentication cancelled', redirect: false })
      }

      await addActivity('failed')
      handleError({
        reason: 'Could not share device response',
        redirect: true,
        description:
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
      })
    }

    await addActivity('success')

    onPinComplete?.()
    setIsProcessing(false)
  }

  const onProofDecline = async () => {
    setIsProcessing(true)

    await addActivity('stopped')

    setIsProcessing(false)

    shutdownDataTransfer()
    handleError({ reason: 'Proof has been declined', redirect: true })
  }

  const onProofComplete = () => {
    shutdownDataTransfer()
    pushToWallet('replace')
  }

  const addActivity = async (status: ActivityStatus) => {
    if (!submission) return
    await addSharedActivityForCredentialsForRequest(
      agent,
      {
        formattedSubmission: submission,
        verifier: {
          hostName: undefined,
          logo: undefined,
          name: 'Unknown party',
          trustedEntities: [],
        },
      },
      status
    )
  }

  // FIXME: Consider re-using the regular flow with an isOffline flag
  return (
    <FunkeOfflineSharingScreen
      isAccepting={isProcessing}
      submission={submission}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      onComplete={onProofComplete}
      usePin={shouldUsePin ?? false}
    />
  )
}
