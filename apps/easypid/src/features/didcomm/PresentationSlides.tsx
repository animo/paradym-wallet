import { useLingui } from '@lingui/react/macro'
import {
  type FormattedSubmission,
  storeSharedActivityForSubmission,
  useAgent,
  useDidCommPresentationActions,
} from '@package/agent'
import { SlideWizard } from '@package/app/components/SlideWizard'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useCallback, useState } from 'react'
import { useDevelopmentMode } from '../../hooks'
import { InteractionErrorSlide } from '../receive/slides/InteractionErrorSlide'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
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
  const [errorReason, setErrorReason] = useState<string>()

  const { t } = useLingui()
  const { acceptPresentation, declinePresentation, proofExchange, acceptStatus, submission, verifierName, logo } =
    useDidCommPresentationActions(proofExchangeId)

  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const setErrorReasonWithError = useCallback(
    (baseMessage: string, error: unknown) => {
      if (isDevelopmentModeEnabled && error instanceof Error) {
        setErrorReason(`${baseMessage}\n\nDevelopment mode error:\n${error.message}`)
      } else {
        setErrorReason(baseMessage)
      }
    },
    [isDevelopmentModeEnabled]
  )

  const onProofAccept = async () => {
    if (!submission) return

    await acceptPresentation({})
      .then(async () => {
        await storeSharedActivityForSubmission(
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
      .catch(async (error) => {
        await storeSharedActivityForSubmission(
          agent,
          submission,
          {
            id: proofExchangeId,
            name: verifierName,
            logo,
          },
          'failed'
        )

        if (proofExchange) await agent.didcomm.proofs.deleteById(proofExchange.id)

        setErrorReasonWithError(t(commonMessages.presentationCouldNotBeShared), error)
      })
  }

  const onProofDecline = async () => {
    if (!proofExchange) return

    if (submission) {
      await storeSharedActivityForSubmission(
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
      void agent.didcomm.proofs.deleteById(proofExchange.id)
    })

    toast.show(t(commonMessages.informationRequestDeclined))

    onCancel()
  }

  return (
    <SlideWizard
      resumeFrom={isExisting ? undefined : 50}
      steps={[
        {
          step: 'loading-request',
          progress: 75,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!submission} isError={false} />,
        },
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
      errorScreen={() => (
        <InteractionErrorSlide key="presentation-error" flowType="verify" reason={errorReason} onCancel={onCancel} />
      )}
      isError={errorReason !== undefined}
      confirmation={getFlowConfirmationText(t, 'verify')}
    />
  )
}
