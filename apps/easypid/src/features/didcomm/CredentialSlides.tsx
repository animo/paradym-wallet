import { useParadymAgent } from '@easypid/agent'
import { useLingui } from '@lingui/react/macro'
import { useDidCommCredentialActions } from '@package/agent'
import { SlideWizard } from '@package/app/components/SlideWizard'
import { useToastController } from '@package/ui'
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

  const { t } = useLingui()

  const onCredentialAccept = async () => {
    const w3cRecord = await acceptCredential().catch(() => {
      toast.show(
        t({
          id: 'credential.accept.error',
          message: 'Something went wrong while storing the credential.',
          comment: 'Shown in a toast when credential storage fails',
        }),
        { customData: { preset: 'danger' } }
      )
      if (credentialExchange) agent.modules.credentials.deleteById(credentialExchange.id)
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

    toast.show(
      t({
        id: 'credential.declined',
        message: 'Credential has been declined.',
        comment: 'Shown in a toast when user declines the credential',
      })
    )
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
              // If state is not idle, it means we have pressed accept
              isAccepting={acceptStatus !== 'idle'}
            />
          ),
        },
      ]}
      onCancel={onCredentialDecline}
      confirmation={getFlowConfirmationText(t, 'issue')}
    />
  )
}
