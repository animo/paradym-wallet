import { useLingui } from '@lingui/react/macro'
import { SlideWizard } from '@package/app'
import { useToastController } from '@package/ui'
import { useDidCommCredentialActions, useParadym } from '@paradym/wallet-sdk/hooks'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'
import { getFlowConfirmationText } from './utils'

type CredentialSlidesProps = {
  isExisting: boolean
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function CredentialSlides({ isExisting, credentialExchangeId, onCancel, onComplete }: CredentialSlidesProps) {
  const paradym = useParadym()
  const toast = useToastController()
  const { acceptCredential, acceptStatus, declineCredential, attributes, display } =
    useDidCommCredentialActions(credentialExchangeId)

  const { t } = useLingui()

  const onCredentialAccept = async () => {
    await acceptCredential().catch(() => {
      toast.show(
        t({
          id: 'credential.accept.error',
          message: 'Something went wrong while storing the credential.',
          comment: 'Shown in a toast when credential storage fails',
        }),
        { customData: { preset: 'danger' } }
      )
      if (credentialExchangeId) paradym.agent.modules.credentials.deleteById(credentialExchangeId)
      onCancel()
    })
  }

  const onCredentialDecline = () => {
    void declineCredential()

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
