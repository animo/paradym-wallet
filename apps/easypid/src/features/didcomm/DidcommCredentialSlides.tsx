import { useDidCommCredentialActions, type ResolveOutOfBandInvitationResultSuccess } from '@package/agent'
import { SlideWizard, usePushToWallet } from '@package/app/src'

import { useState } from 'react'

import { useParadymAgent } from '@easypid/agent'
import { router } from 'expo-router'
import { CredentialErrorSlide } from '../receive/slides/CredentialErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { addReceivedActivity, useActivities } from '../activity/activityRecord'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { useToastController } from '@package/ui'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'

interface DidcommCredentialsSlidesProps {
  resolved: ResolveOutOfBandInvitationResultSuccess & { flowType: 'issue' }
  credentialExchangeId?: string
}

export function DidcommCredentialsSlides({ resolved, credentialExchangeId }: DidcommCredentialsSlidesProps) {
  const pushToWallet = usePushToWallet()
  const [resolvedCredentialExchangeId, setCredentialExchangeId] = useState(credentialExchangeId)

  const [errorReason, setErrorReason] = useState<string>()

  const handleNavigation = (type: 'replace' | 'back') => {
    // When starting from the inbox, we want to go back to the inbox on finish
    if (params.navigationType === 'inbox') {
      router.back()
    } else {
      pushToWallet(type)
    }
  }

  const onCancel = () => {
    if (resolved?.flowType === 'connect') {
      void agent.modules.credentials.deleteById(notification.id)
    } else if (notification?.type === 'proofExchange') {
      void agent.modules.proofs.deleteById(notification.id)
    }

    handleNavigation('back')
  }

  const onComplete = () => handleNavigation('replace')

  const { agent } = useParadymAgent()
  const toast = useToastController()
  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions()
  const { activities } = useActivities({ filters: { entityId: credentialExchange?.connectionId } })

  const onCredentialAccept = async () => {
    const w3cRecord = await acceptCredential().catch(() => {
      toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      onCancel()
    })

    if (w3cRecord) {
      await addReceivedActivity(agent, {
        entityId: credentialExchange?.connectionId as string,
        name: display.issuer.name,
        logo: display.issuer.logo,
        backgroundColor: '#ffffff', // Default to a white background for now
        credentialIds: [`w3c-credential-${w3cRecord?.id}`],
      })
    }
  }

  const onCredentialDecline = () => {
    if (credentialExchange) {
      declineCredential().finally(() => {
        void agent.modules.credentials.deleteById(credentialExchange.id)
      })
    }

    toast.show('Credential has been declined.')
    onCancel()
  }

  return (
    <SlideWizard
      key="didcomm-slides"
      steps={[
        {
          step: 'loading-request',
          progress: 33,
          screen: <LoadingRequestSlide key="loading-request" isLoading={false} isError={!!errorReason} />,
        },
        {
          step: 'verify-issuer',
          progress: 33,
          backIsCancel: true,
          screen: (
            <VerifyPartySlide
              key="verify-issuer"
              type="offer"
              name={display.issuer.name}
              logo={display.issuer.logo}
              entityId={credentialExchange?.connectionId as string}
              lastInteractionDate={activities?.[0]?.date}
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
              onGoToWallet={onComplete}
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
      errorScreen={() => <CredentialErrorSlide key="credential-error" reason={errorReason} onCancel={onCancel} />}
      isError={!!errorReason}
      onCancel={onCancel}
      confirmation={{
        title: 'Decline card?',
        description: 'If you decline, you will not receive the card.',
        confirmText: 'Yes, decline',
      }}
    />
  )
}
