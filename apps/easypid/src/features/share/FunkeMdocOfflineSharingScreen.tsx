import { useAppAgent } from '@easypid/agent'
import { setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { type FormattedSubmission, getSubmissionForMdocDocumentRequest } from '@package/agent'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { useToastController } from '@package/ui'
import { useCallback, useEffect, useState } from 'react'
import { type ActivityStatus, addSharedActivityForCredentialsForRequest } from '../activity/activityRecord'
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
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [submission, setSubmission] = useState<FormattedSubmission>()
  const [isProcessing, setIsProcessing] = useState(false)

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

  const onProofAccept = async ({ pin, onPinComplete, onPinError }: onPinSubmitProps) => {
    // Already checked for submission in the useEffect
    if (!submission) return
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
      }

      handleError({
        reason: 'Authentication Error',
        redirect: true,
        description:
          e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
      })
    }

    // Once this returns we just assume it's successful
    try {
      await shareDeviceResponse({
        agent,
        deviceRequest,
        sessionTranscript,
        submission,
      })
    } catch (e) {
      await addActivity('failed')
      handleError({
        reason: 'Could not share device response',
        redirect: true,
        description:
          e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
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
          entityId: '6df3d57e-4c9c-41c3-bb9f-936d88c0968d',
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
    />
  )
}
