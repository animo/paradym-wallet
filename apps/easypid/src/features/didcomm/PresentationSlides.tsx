import { useAgent, useDidCommPresentationActions } from '@package/agent'
import { SlideWizard } from '@package/app'
import { useToastController } from '@package/ui'
import type { FormattedSubmission } from '@paradym/wallet-sdk/src/format/submission'
import { addSharedActivityForSubmission } from '../activity/activityRecord'
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
  const { agent } = useAgent()
  const toast = useToastController()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName, logo } =
    useDidCommPresentationActions(proofExchangeId)

  const onProofAccept = async () => {
    if (!submission) return

    await acceptPresentation({})
      .then(async () => {
        await addSharedActivityForSubmission(
          agent,
          submission,
          {
            id: proofExchangeId,
            name: verifierName,
            logo,
          },
          'success'
        )
      })
      .catch(async () => {
        toast.show('Presentation could not be shared.', { customData: { preset: 'danger' } })
        await addSharedActivityForSubmission(
          agent,
          submission,
          {
            id: proofExchangeId,
            name: verifierName,
            logo,
          },
          'failed'
        )
        onCancel()
      })
  }

  const onProofDecline = async () => {
    if (!proofExchange) return

    if (submission) {
      await addSharedActivityForSubmission(
        agent,
        submission,
        {
          id: proofExchangeId,
          name: verifierName,
          logo,
        },
        'stopped'
      )
    }

    declinePresentation().finally(() => {
      void agent.modules.proofs.deleteById(proofExchange.id)
    })

    toast.show('Information request has been declined.')
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
      onCancel={onCancel}
      confirmation={getFlowConfirmationText('verify')}
    />
  )
}
