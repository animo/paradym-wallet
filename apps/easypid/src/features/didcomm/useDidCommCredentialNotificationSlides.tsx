import { useParadymAgent } from '@easypid/agent'
import { useDidCommCredentialActions } from '@package/agent'
import type { SlideStep } from '@package/app/src'
import { useToastController } from '@package/ui'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'

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

  const onCredentialAccept = async () => {
    await acceptCredential().catch(() => {
      toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      onCancel()
    })
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
