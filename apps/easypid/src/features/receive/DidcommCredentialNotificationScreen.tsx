import { useAgent, useDidCommCredentialActions } from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'
import { useToastController } from '@package/ui'
import React, { useState } from 'react'

import { CredentialRetrievalSlide } from './slides/CredentialRetrievalSlide'
import { LoadingRequestSlide } from './slides/LoadingRequestSlide'

interface DidCommCredentialNotificationScreenProps {
  credentialExchangeId: string
}

export function DidCommCredentialNotificationScreen({
  credentialExchangeId,
}: DidCommCredentialNotificationScreenProps) {
  const { agent } = useAgent()
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const onCancel = () => pushToWallet('back')
  const onGoToWallet = () => pushToWallet()

  const [errorReason, setErrorReason] = useState<string>()

  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  const onCredentialAccept = async () => {
    await acceptCredential()
      .then(() => {
        toast.show('Credential has been added to your wallet.', { customData: { preset: 'success' } })
      })
      .catch(() => {
        toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      })
      .finally(() => {
        pushToWallet()
      })
  }

  const onCredentialDecline = () => {
    if (!credentialExchange) {
      return
    }

    declineCredential().finally(() => {
      void agent.credentials.deleteById(credentialExchange.id)
    })

    toast.show('Credential has been declined.')
    pushToWallet()
  }

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 16.5,
          screen: (
            <LoadingRequestSlide
              key="loading-request"
              isLoading={!credentialExchange || !attributes || !display}
              isError={!!errorReason}
            />
          ),
        },
        {
          step: 'retrieve-credential',
          progress: 82.5,
          backIsCancel: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={display}
              attributes={attributes ?? {}}
              isCompleted={acceptStatus === 'idle'}
              onAccept={onCredentialAccept}
              onDecline={onCredentialDecline}
            />
          ),
        },
      ]}
      onCancel={onCancel}
    />
  )
}
