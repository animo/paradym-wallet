import { useParadymAgent } from '@easypid/agent'
import { SlideWizard } from '@package/app'
import { useToastController } from '@package/ui'
import { useDidCommCredentialActions } from '@paradym/wallet-sdk/src/hooks/useDidCommCredentialActions'
import { addReceivedActivity } from '../activity/activityRecord'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'
import { getFlowConfirmationText } from './utils'

type CredentialSlidesProps = {
  isExisting: boolean
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function CredentialSlides({ isExisting, credentialExchangeId, onCancel, onComplete }: CredentialSlidesProps) {
  const { agent } = useParadymAgent()
  const toast = useToastController()
  const { acceptCredential, acceptStatus, declineCredential, credentialExchange, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  const onCredentialAccept = async () => {
    const w3cRecord = await acceptCredential().catch(() => {
      toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      onCancel()
    })

    if (w3cRecord) {
      await addReceivedActivity(agent, {
        entityId: credentialExchange?.connectionId,
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
      resumeFrom={isExisting ? undefined : 50}
      steps={[
        {
          step: 'retrieve-credential',
          progress: isExisting ? 50 : 75,
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
      onCancel={onCancel}
      confirmation={getFlowConfirmationText('issue')}
    />
  )
}
