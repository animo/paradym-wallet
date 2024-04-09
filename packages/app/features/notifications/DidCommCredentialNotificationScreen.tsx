import { useAcceptDidCommCredential, useAgent } from '@internal/agent'
import { useToastController } from '@internal/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingInformationScreen } from './components/GettingInformationScreen'

interface DidCommCredentialNotificationScreenProps {
  credentialExchangeId: string
}

export function DidCommCredentialNotificationScreen({
  credentialExchangeId,
}: DidCommCredentialNotificationScreenProps) {
  const { agent } = useAgent()

  const router = useRouter()
  const toast = useToastController()

  const { acceptCredential, status, credentialExchange, attributes, display } =
    useAcceptDidCommCredential(credentialExchangeId)

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  if (!credentialExchange || !attributes || !display) {
    return <GettingInformationScreen type="credential" />
  }

  const onCredentialAccept = async () => {
    await acceptCredential()
      .then(() => {
        toast.show('Credential has been added to your wallet.')
      })
      .catch(() => {
        toast.show('Something went wrong while storing the credential.')
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    void agent.credentials.deleteById(credentialExchange.id)

    toast.show('Credential has been declined.')
    pushToWallet()
  }

  return (
    <CredentialNotificationScreen
      display={display}
      attributes={attributes}
      onAccept={() => {
        void onCredentialAccept()
      }}
      onDecline={onCredentialDecline}
      // If state is not idle, it means we have pressed accept
      isAccepting={status !== 'idle'}
    />
  )
}
