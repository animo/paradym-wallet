import { useAgent, useDidCommCredentialActions } from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'
import { useToastController } from '@package/ui'
import React, { useEffect, useState } from 'react'

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
  const onGoToWallet = () => pushToWallet('replace')
  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  const [errorReason, setErrorReason] = useState<string>()

  useEffect(() => {
    if (acceptStatus === 'error') {
      setErrorReason('Something went wrong while fetching the card information.')
    }
  }, [acceptStatus])

  const onCredentialAccept = async () => {
    await acceptCredential()
      .then(() => {
        // TODO: Create activity event
      })
      .catch(() => {
        toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
        onCancel()
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
    onCancel()
  }

  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 33,
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
          progress: 66,
          backIsCancel: true,
          screen: (
            <CredentialRetrievalSlide
              key="retrieve-credential"
              onGoToWallet={onGoToWallet}
              display={display}
              attributes={attributes ?? {}}
              isCompleted={acceptStatus === 'success'}
              onAccept={onCredentialAccept}
              onDecline={onCredentialDecline}
              // If state is not idle, it means we have pressed accept
              isAccepting={acceptStatus !== 'idle'}
            />
          ),
        },
      ]}
      onCancel={onCancel}
    />
  )
}
