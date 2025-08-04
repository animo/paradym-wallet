import { useLingui } from '@lingui/react/macro'
import { SlideWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'
import { useDidCommPresentationActions, useParadym } from '@paradym/wallet-sdk/hooks'
import { PresentationSuccessSlide } from '../share/slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from '../share/slides/ShareCredentialsSlide'
import { getFlowConfirmationText } from './utils'

type PresentationSlidesProps = {
  isExisting: boolean
  proofExchangeId: string
  onCancel: () => void
  onComplete: () => void
}

export function PresentationSlides({ isExisting, proofExchangeId, onCancel, onComplete }: PresentationSlidesProps) {
  const paradym = useParadym()
  const toast = useToastController()
  const { t } = useLingui()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName, logo } =
    useDidCommPresentationActions(proofExchangeId)

  const onProofAccept = async () => {
    if (!submission) return

    await acceptPresentation({}).catch(async () => {
      toast.show(t(commonMessages.presentationCouldNotBeShared), { customData: { preset: 'danger' } })

      if (proofExchange) paradym.agent.modules.proofs.deleteById(proofExchange.id)

      onCancel()
    })
  }

  const onProofDecline = async () => {
    if (!proofExchange) return

    void declinePresentation()

    toast.show(t(commonMessages.informationRequestDeclined))

    onCancel()
  }

  return (
    <SlideWizard
      resumeFrom={isExisting ? undefined : 50}
      steps={[
        {
          step: 'retrieve-presentation',
          progress: 75,
          backIsCancel: true,
          screen: (
            <ShareCredentialsSlide
              key="share-credentials"
              onAccept={onProofAccept}
              onDecline={onProofDecline}
              submission={submission as FormattedSubmission}
              isAccepting={acceptStatus !== 'idle'}
              overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
            />
          ),
        },
        {
          step: 'success',
          progress: 100,
          backIsCancel: true,
          screen: <PresentationSuccessSlide showReturnToApp verifierName={verifierName} onComplete={onComplete} />,
        },
      ]}
      onCancel={onProofDecline}
      confirmation={getFlowConfirmationText(t, 'verify')}
    />
  )
}
