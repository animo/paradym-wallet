import { useAppAgent } from '@easypid/agent'
import { type FormattedSubmission, getSubmissionForMdocDocumentRequest } from '@package/agent'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { useToastController } from '@package/ui'
import { useEffect, useState } from 'react'
import { type ActivityStatus, addSharedActivityForCredentialsForRequest } from '../activity/activityRecord'
import { shareDeviceResponse, shutdownDataTransfer } from '../proximity'
import { FunkeOfflineSharingScreen } from './FunkeOfflineSharingScreen'
import type { PresentationRequestResult } from './components/utils'

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

  const [submission, setSubmission] = useState<FormattedSubmission>()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    getSubmissionForMdocDocumentRequest(agent, deviceRequest)
      .then((submission) => {
        // We can't hare multiple documents at the moment
        if (submission.entries.length > 1) {
          toast.show('Presentation could not be shared.', {
            message: 'Multiple cards requested, but only one card can be shared in-person',
            customData: { preset: 'danger' },
          })
          pushToWallet()
        } else {
          setSubmission(submission)
        }
      })
      .catch((error) => {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for mdoc device request', {
          error,
        })

        pushToWallet()
      })
  }, [agent, deviceRequest, toast.show, pushToWallet])

  const onProofAccept = async (): Promise<PresentationRequestResult> => {
    if (!submission) {
      return {
        status: 'error',
        result: {
          title: 'No submission found.',
        },
      }
    }

    setIsProcessing(true)

    // Once this returns we just assume it's successful
    try {
      await shareDeviceResponse({
        agent,
        deviceRequest,
        sessionTranscript,
        submission,
      })
    } catch (error) {
      agent.config.logger.error('Could not share device response', { error })
      await addActivity('failed')
      return {
        status: 'error',
        result: {
          title: 'Failed to share proof.',
        },
      }
    }

    await addActivity('success')

    setIsProcessing(false)

    return {
      status: 'success',
      result: {
        title: 'Proof accepted',
      },
    }
  }

  const onProofDecline = async () => {
    setIsProcessing(true)

    await addActivity('stopped')

    setIsProcessing(false)

    shutdownDataTransfer()
    pushToWallet()
    toast.show('Proof has been declined.', { customData: { preset: 'danger' } })
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
