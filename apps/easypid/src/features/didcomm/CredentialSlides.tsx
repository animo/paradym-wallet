import { SlideWizard } from '@package/app'
import { useToastController } from '@package/ui'
import { useParadymWalletSdk } from '@paradym/wallet-sdk'
import { CredentialRetrievalSlide } from '../receive/slides/CredentialRetrievalSlide'
import { getFlowConfirmationText } from './utils'

type CredentialSlidesProps = {
  isExisting: boolean
  credentialExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function CredentialSlides({ isExisting, credentialExchangeId, onCancel, onComplete }: CredentialSlidesProps) {
  const pws = useParadymWalletSdk()

  const toast = useToastController()
  const { acceptCredential, acceptStatus, declineCredential, attributes, display } =
    pws.hooks.useDidCommCredentialActions(credentialExchangeId)

  const onCredentialAccept = async () => {
    await acceptCredential().catch(() => {
      toast.show('Something went wrong while storing the credential.', { customData: { preset: 'danger' } })
      onCancel()
    })
  }

  const onCredentialDecline = () => {
    void declineCredential()

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
