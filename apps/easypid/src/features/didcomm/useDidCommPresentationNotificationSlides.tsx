import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'

import type { SlideStep } from '@package/app/src'
import { addSharedActivityForSubmission, useActivities } from '../activity/activityRecord'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PresentationSuccessSlide } from '../share/slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'

interface DidCommPresentationNotificationSlidesProps {
  proofExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function useDidCommPresentationNotificationSlides({
  proofExchangeId,
  onCancel,
  onComplete,
}: DidCommPresentationNotificationSlidesProps) {
  const { agent } = useAgent()
  const toast = useToastController()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName, logo } =
    useDidCommPresentationActions(proofExchangeId)
  const { activities } = useActivities({ filters: { entityId: proofExchange?.connectionId } })

  const onProofAccept = async () => {
    if (!submission) return

    await acceptPresentation({})
      .then(async () => {
        await addSharedActivityForSubmission(
          agent,
          submission,
          {
            id: proofExchangeId,
            name: verifierName,
            logo,
          },
          'success'
        )
      })
      .catch(async () => {
        toast.show('Presentation could not be shared.', { customData: { preset: 'danger' } })
        await addSharedActivityForSubmission(
          agent,
          submission,
          {
            id: proofExchangeId,
            name: verifierName,
            logo,
          },
          'failed'
        )
        onCancel()
      })
  }

  const onProofDecline = async () => {
    if (!proofExchange) return

    if (submission) {
      await addSharedActivityForSubmission(
        agent,
        submission,
        {
          id: proofExchangeId,
          name: verifierName,
          logo,
        },
        'stopped'
      )
    }

    declinePresentation().finally(() => {
      void agent.modules.proofs.deleteById(proofExchange.id)
    })

    toast.show('Information request has been declined.')
    onCancel()
  }

  if (!submission) return []

  return [
    {
      step: 'verify-issuer',
      progress: 33,
      backIsCancel: true,
      screen: (
        <VerifyPartySlide
          key="verify-issuer"
          type="request"
          name={verifierName}
          logo={logo}
          entityId={proofExchange?.connectionId as string}
          lastInteractionDate={activities?.[0]?.date}
        />
      ),
    },
    {
      step: 'retrieve-presentation',
      progress: 66,
      backIsCancel: true,
      screen: (
        <ShareCredentialsSlide
          key="share-credentials"
          onAccept={onProofAccept}
          onDecline={onProofDecline}
          submission={submission}
          isAccepting={acceptStatus !== 'idle'}
          overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
        />
      ),
    },
    {
      step: 'success',
      progress: 100,
      backIsCancel: true,
      screen: <PresentationSuccessSlide verifierName={verifierName} onComplete={onComplete} />,
    },
  ] as SlideStep[]
}
