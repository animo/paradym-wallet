import type { FormattedSubmission } from '@package/agent'

import { type SlideStep, SlideWizard } from '@package/app'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PinSlide } from './slides/PinSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'
import { PresentationSuccessSlide } from './slides/SuccessSlide'

interface FunkePresentationNotificationScreenProps {
  usePin: boolean
  isAccepting: boolean
  onAccept: () => Promise<void>
  onDecline: () => void
  onComplete: () => void
  submission?: FormattedSubmission
  verifierHost?: string
}

export function FunkePresentationNotificationScreen({
  usePin,
  onAccept,
  onDecline,
  isAccepting,
  submission,
  verifierHost,
  onComplete,
}: FunkePresentationNotificationScreenProps) {
  return (
    <SlideWizard
      steps={
        [
          {
            step: 'loading-request',
            progress: 16.5,
            screen: <LoadingRequestSlide key="loading-request" isLoading={!submission} isError={false} />,
          },
          {
            step: 'verify-issuer',
            progress: 33,
            backIsCancel: true,
            screen: <VerifyPartySlide key="verify-issuer" />,
          },
          {
            step: 'share-credentials',
            progress: 66,
            screen: (
              <ShareCredentialsSlide
                key="share-credentials"
                onAccept={usePin ? undefined : onAccept}
                onDecline={onDecline}
                verifierHost={verifierHost ?? 'Unknown'}
                submission={submission}
                isAccepting={isAccepting}
              />
            ),
          },
          usePin && {
            step: 'pin-enter',
            progress: 66,
            screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinComplete={onAccept} />,
          },
          {
            step: 'success',
            progress: 100,
            screen: <PresentationSuccessSlide onComplete={onComplete} />,
          },
        ].filter(Boolean) as SlideStep[]
      }
      isError={false}
      onCancel={onDecline}
    />
  )
}
