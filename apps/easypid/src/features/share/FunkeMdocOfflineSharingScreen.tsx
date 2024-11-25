import { ClaimFormat, utils } from '@credo-ts/core'
import { useAppAgent } from '@easypid/agent'
import { usePidCredential } from '@easypid/hooks'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { useToastController } from '@package/ui'
import { useMemo, useState } from 'react'
import { type ActivityStatus, addSharedActivity } from '../activity/activityRecord'
import { shareDeviceResponse } from '../proximity'
import { FunkeOfflineSharingScreen } from './FunkeOfflineSharingScreen'
import type { PresentationRequestResult } from './components/utils'

type FunkeMdocOfflineSharingScreenProps = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  requestedAttributes: string[]
}

// Entry point for offline sharing with Mdoc
export function FunkeMdocOfflineSharingScreen({
  sessionTranscript,
  deviceRequest,
  requestedAttributes,
}: FunkeMdocOfflineSharingScreenProps) {
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const { credentials } = usePidCredential()
  const mdocPidCredential = credentials?.find((cred) => cred.claimFormat === ClaimFormat.MsoMdoc)

  const [isProcessing, setIsProcessing] = useState(false)

  const disclosedPayloadForDisplay = useMemo(
    () =>
      requestedAttributes
        ? requestedAttributes?.reduce(
            (acc, attr) => ({
              ...acc,
              [attr]: mdocPidCredential?.attributes[attr],
            }),
            {}
          )
        : {},
    [mdocPidCredential, requestedAttributes]
  )

  const submission = useMemo(() => {
    if (!mdocPidCredential || !requestedAttributes || !disclosedPayloadForDisplay) return

    return {
      name: 'PID Request',
      areAllSatisfied: true,
      entries: [
        {
          inputDescriptorId: '123',
          isSatisfied: true,
          name: 'PID Request',
          credentials: [
            {
              id: mdocPidCredential?.id,
              credentialName: mdocPidCredential?.display.name,
              issuerName: mdocPidCredential?.display.issuer.name,
              issuerImage: mdocPidCredential?.display.issuer.logo,
              requestedAttributes: requestedAttributes,
              disclosedPayload: disclosedPayloadForDisplay,
              claimFormat: ClaimFormat.MsoMdoc,
              metadata: mdocPidCredential?.metadata,
              backgroundColor: mdocPidCredential?.display.backgroundColor,
              textColor: mdocPidCredential?.display.textColor,
              backgroundImage: mdocPidCredential?.display.backgroundImage,
            },
          ],
        },
      ],
    }
  }, [mdocPidCredential, requestedAttributes, disclosedPayloadForDisplay])

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
      })
    } catch (error) {
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

    pushToWallet()
    toast.show('Proof has been declined.', { customData: { preset: 'danger' } })
  }

  const addActivity = async (status: ActivityStatus) => {
    await addSharedActivity(agent, {
      status,
      entity: {
        id: utils.uuid(),
        name: 'Unknown party',
        host: 'https://example.com',
      },
      request: {
        name: submission?.name as string,
        credentials: [
          {
            id: mdocPidCredential?.id as string,
            disclosedAttributes: requestedAttributes,
            disclosedPayload: disclosedPayloadForDisplay,
          },
        ],
        failureReason: status === 'failed' ? 'unknown' : undefined,
      },
    })
  }

  // FIXME: Consider re-using the regular flow with an isOffline flag
  return (
    <FunkeOfflineSharingScreen
      isAccepting={isProcessing}
      submission={submission}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
