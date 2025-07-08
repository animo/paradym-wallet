import { type SlideStep, SlideWizard } from '@package/app'
import type { FormattedSubmission } from '@paradym/wallet-sdk/src/format/submission'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface FunkeOfflineSharingScreenProps {
  submission?: FormattedSubmission
  usePin: boolean
  isAccepting: boolean
  onAccept: () => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

export function FunkeOfflineSharingScreen({
  submission,
  usePin,
  isAccepting,
  onAccept,
  onDecline,
  onComplete,
}: FunkeOfflineSharingScreenProps) {
  return (
    <SlideWizard
      steps={
        [
          {
            step: 'loading-request',
            progress: 30,
            screen: <LoadingRequestSlide key="loading-request" isLoading={!submission} isError={false} />,
          },
          {
            step: 'share-credentials',
            progress: 60,
            backIsCancel: true,
            screen: (
              <ShareCredentialsSlide
                key="share-credentials"
                onAccept={usePin ? undefined : onAccept}
                onDecline={onDecline}
                submission={submission as FormattedSubmission}
                isAccepting={isAccepting}
                isOffline
              />
            ),
          },
          usePin && {
            step: 'pin-enter',
            progress: 80,
            screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinSubmit={onAccept} />,
          },
          {
            step: 'success',
            progress: 100,
            backIsCancel: true,
            screen: <PresentationSuccessSlide onComplete={onComplete} />,
          },
        ].filter(Boolean) as SlideStep[]
      }
      onCancel={onDecline}
    />
  )
}
