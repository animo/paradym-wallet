import { useAcceptDidCommCredential, useAgent } from '@internal/agent'
import { useToastController } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { CredentialNotificationScreen } from './components/CredentialNotificationScreen'
import { GettingCredentialInformationScreen } from './components/GettingCredentialInformationScreen'

type Query = { credentialExchangeId: string }

const { useParams } = createParam<Query>()

export function DidCommCredentialNotificationScreen() {
  const { agent } = useAgent()

  const router = useRouter()
  const toast = useToastController()
  const { params } = useParams()

  const { acceptCredential, status, credentialExchange, attributes, display } =
    useAcceptDidCommCredential(params.credentialExchangeId)

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  if (!credentialExchange || !attributes || !display) {
    return <GettingCredentialInformationScreen />
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
