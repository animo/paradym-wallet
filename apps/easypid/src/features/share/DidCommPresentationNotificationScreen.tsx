import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'
import React, { useState } from 'react'

import { usePushToWallet } from '@package/app/src'
import { useActivities } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { PresentationRequestResult } from './components/utils'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({ proofExchangeId }: DidCommPresentationNotificationScreenProps) {
  const { agent } = useAgent()

  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName } =
    useDidCommPresentationActions(proofExchangeId)

  const [selectedCredentials, setSelectedCredentials] = useState<{
    [inputDescriptorId: string]: string
  }>({})

  const onProofAccept = async (): Promise<PresentationRequestResult> => {
    await acceptPresentation(selectedCredentials)
      .then(() => {
        toast.show('Information has been successfully shared.', { customData: { preset: 'success' } })
        return { status: 'success', result: { title: 'Presentation shared.' }, redirectToWallet: false }
      })
      .catch(() => {
        toast.show('Presentation could not be shared.', { customData: { preset: 'danger' } })
        return { status: 'error', result: { title: 'Presentation could not be shared.' }, redirectToWallet: false }
      })
    return { status: 'success', result: { title: 'Presentation shared.' }, redirectToWallet: false }
  }

  const onProofDecline = () => {
    if (!proofExchange) {
      return
    }

    declinePresentation().finally(() => {
      void agent.proofs.deleteById(proofExchange.id)
    })

    toast.show('Information request has been declined.')
    pushToWallet()
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={false}
      entityId={'NO MATCH'}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={acceptStatus !== 'idle'}
      verifierName={verifierName}
      trustedEntities={[]}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
