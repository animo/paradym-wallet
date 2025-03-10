import { useParadymAgent } from '@easypid/agent'
import { useDidCommCredentialActions } from '@package/agent'
import type { SlideStep } from '@package/app/src'
import { useToastController } from '@package/ui'
import { addReceivedActivity, useActivities } from '../activity/activityRecord'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'

interface DidCommCredentialNotificationSlidesProps {
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function useDidCommCredentialNotificationSlides({
  credentialExchangeId,
  onCancel,
  onComplete,
}: DidCommCredentialNotificationSlidesProps) {
  const { agent } = useParadymAgent()
  const toast = useToastController()
  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)
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

  return [
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
  ] as SlideStep[]
}
