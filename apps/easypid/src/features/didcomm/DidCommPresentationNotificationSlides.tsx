import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'
import React from 'react'

import type { SlideStep } from '@package/app/src'
import { addSharedActivityForSubmission } from '../activity/activityRecord'
import { PresentationSuccessSlide } from '../share/slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'

interface DidCommPresentationNotificationSlidesProps {
  proofExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function DidCommPresentationNotificationSlides({
  proofExchangeId,
  onCancel,
  onComplete,
}: DidCommPresentationNotificationSlidesProps) {
  const { agent } = useAgent()
  const toast = useToastController()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName } =
    useDidCommPresentationActions(proofExchangeId)

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
        },
        'stopped'
      )
    }

    declinePresentation().finally(() => {
      void agent.proofs.deleteById(proofExchange.id)
    })

    toast.show('Information request has been declined.')
    onCancel()
  }

  if (!submission) return []

  return [
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
      screen: <PresentationSuccessSlide onComplete={onComplete} />,
    },
  ] as SlideStep[]
}
