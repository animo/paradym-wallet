import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'
import React from 'react'

import { usePushToWallet } from '@package/app/src'
import { addSharedActivityForSubmission } from '../activity/activityRecord'
import type { PresentationRequestResult } from './components/utils'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({ proofExchangeId }: DidCommPresentationNotificationScreenProps) {
  const { agent } = useAgent()

  const toast = useToastController()
  const pushToWallet = usePushToWallet()
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
        pushToWallet()
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
    pushToWallet()
  }

  if (!submission) return null

  return (
    <ShareCredentialsSlide
      key="share-credentials"
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={acceptStatus !== 'idle'}
      overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
    />
  )
}
