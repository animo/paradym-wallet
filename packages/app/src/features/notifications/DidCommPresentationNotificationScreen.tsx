import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { useToastController } from '@package/ui'
import React, { useState } from 'react'
import { useRouter } from 'solito/router'

import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

interface DidCommPresentationNotificationScreenProps {
  proofExchangeId: string
}

export function DidCommPresentationNotificationScreen({ proofExchangeId }: DidCommPresentationNotificationScreenProps) {
  const { agent } = useAgent()

  const router = useRouter()
  const toast = useToastController()

  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName } =
    useDidCommPresentationActions(proofExchangeId)

  const [selectedCredentials, setSelectedCredentials] = useState<{
    [groupName: string]: number
  }>({})

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  if (!submission || !proofExchange) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    acceptPresentation(selectedCredentials)
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
      isAccepting={acceptStatus !== 'idle'}
      verifierName={verifierName}
      selectedCredentials={selectedCredentials}
      onSelectCredentialForInputDescriptor={(groupName: string, vcIndex: number) =>
        setSelectedCredentials((selectedCredentials) => ({
          ...selectedCredentials,
          [groupName]: vcIndex,
        }))
      }
    />
  )
}
