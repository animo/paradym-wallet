import { useAppAgent } from '@easypid/agent'
import { setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode } from '@easypid/hooks'
import { useShouldUsePinForSubmission } from '@easypid/hooks/useShouldUsePinForPresentation'
import { useLingui } from '@lingui/react/macro'
import {
  type ActivityStatus,
  BiometricAuthenticationCancelledError,
  type FormattedSubmission,
  getSubmissionForMdocDocumentRequest,
  storeSharedActivityForCredentialsForRequest,
} from '@package/agent'
import { usePushToWallet } from '@package/app/hooks/usePushToWallet'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
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
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [submission, setSubmission] = useState<FormattedSubmission>()
  const [isProcessing, setIsProcessing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(submission)
  const { t } = useLingui()

  useEffect(() => {
    getSubmissionForMdocDocumentRequest(agent, deviceRequest)
      .then(setSubmission)
      .catch((error) => {
        toast.show(t(commonMessages.presentationInformationCouldNotBeExtracted), {
          message:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for mdoc device request', {
          error,
        })

        pushToWallet()
      })
  }, [agent, deviceRequest, toast.show, pushToWallet, isDevelopmentModeEnabled, t])

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
          return handleError({
            reason: t(commonMessages.invalidPinEntered),
            redirect: false,
          })
        }

        return handleError({
          reason: t({
            id: 'funkeMdoc.error.auth',
            message: 'Authentication Error',
            comment: 'Shown when there is a general auth error during offline flow',
          }),
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
    } catch (e) {
      if (e instanceof BiometricAuthenticationCancelledError) {
        // Triggers the pin animation
        onPinError?.()
        return handleError({
          reason: t(commonMessages.biometricAuthenticationCancelled),
          redirect: false,
        })
      }

      await addActivity('failed')
      return handleError({
        reason: t({
          id: 'funkeMdoc.error.sharing',
          message: 'Could not share device response',
          comment: 'Shown when shareDeviceResponse fails',
        }),
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
    handleError({
      reason: t({
        id: 'funkeMdoc.proof.declined',
        message: 'Proof has been declined',
        comment: 'Shown when user declines sharing proof',
      }),
      redirect: true,
    })
  }

  const onProofComplete = () => {
    shutdownDataTransfer()
    pushToWallet()
  }

  const addActivity = async (status: Exclude<ActivityStatus, 'pending'>) => {
    if (!submission) return
    await storeSharedActivityForCredentialsForRequest(
      agent,
      {
        formattedSubmission: submission,
        verifier: {
          hostName: undefined,
          logo: undefined,
          name: t(commonMessages.unknownOrganization),
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
