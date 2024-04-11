import { useAcceptDidCommPresentation, useAgent } from '@internal/agent'
import { useToastController } from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({
  proofExchangeId,
}: DidCommPresentationNotificationScreenProps) {
  const { agent } = useAgent()

  const router = useRouter()
  const toast = useToastController()

  const {
    acceptPresentation,
    declinePresentation,
    proofExchange,
    status,
    submission,
    verifierName,
  } = useAcceptDidCommPresentation(proofExchangeId)

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  if (!submission || !proofExchange) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    acceptPresentation()
      .then(() => {
        toast.show('Information has been successfully shared.')
      })
      .catch(() => {
        toast.show('Presentation could not be shared.')
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    declinePresentation().finally(() => {
      void agent.proofs.deleteById(proofExchange.id)
    })

    toast.show('Information request has been declined.')
    pushToWallet()
  }

  return (
    <PresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      // If state is not idle, it means we have pressed accept
      isAccepting={status !== 'idle'}
      verifierName={verifierName}
    />
  )
}
