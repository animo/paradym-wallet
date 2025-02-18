import type { FormattedSubmission } from 'packages/agent/src'
import { SlideWizard } from 'packages/app/src/components'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { PinSlide, type onPinSubmitProps } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface FunkeOfflineSharingScreenProps {
  submission?: FormattedSubmission
  isAccepting: boolean
  onAccept: ({ pin, onPinComplete, onPinError }: onPinSubmitProps) => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

export function FunkeOfflineSharingScreen({
  submission,
  isAccepting,
  onAccept,
  onDecline,
  onComplete,
}: FunkeOfflineSharingScreenProps) {
  return (
    <SlideWizard
      steps={[
        {
          step: 'loading-request',
          progress: 25,
          screen: <LoadingRequestSlide key="loading-request" isLoading={!submission} isError={false} />,
        },
        {
          step: 'share-credentials',
          progress: 50,
          backIsCancel: true,
          screen: (
            <ShareCredentialsSlide
              key="share-credentials"
              onAccept={undefined} // onAccept is handled in the next slide
              onDecline={onDecline}
              submission={submission as FormattedSubmission}
              isAccepting={isAccepting}
              isOffline
            />
          ),
        },
        {
          step: 'pin-enter',
          progress: 75,
          screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinSubmit={onAccept} />,
        },
        {
          step: 'success',
          progress: 100,
          backIsCancel: true,
          screen: <PresentationSuccessSlide onComplete={onComplete} />,
        },
      ]}
      onCancel={onDecline}
    />
  )
}
