import type { DisplayImage, FormattedSubmission } from '@package/agent'

import { type SlideStep, SlideWizard } from '@package/app'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import type { PresentationRequestResult } from './components/utils'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface FunkePresentationNotificationScreenProps {
  host: string
  verifierName?: string
  logo?: DisplayImage
  lastInteractionDate?: string
  approvalsCount?: number

  submission?: FormattedSubmission
  usePin: boolean
  isAccepting: boolean
  onAccept: () => Promise<PresentationRequestResult>
  onAcceptWithPin: (pin: string) => Promise<PresentationRequestResult>
  onDecline: () => void
  onComplete: () => void
}

export function FunkePresentationNotificationScreen({
  host,
  verifierName,
  logo,
  lastInteractionDate,
  approvalsCount,
  usePin,
  onAccept,
  onAcceptWithPin,
  onDecline,
  isAccepting,
  submission,
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
            screen: (
              <VerifyPartySlide
                key="verify-issuer"
                type="request"
                name={verifierName}
                host={host}
                logo={logo}
                lastInteractionDate={lastInteractionDate}
                approvalsCount={approvalsCount}
              />
            ),
          },
          {
            step: 'share-credentials',
            progress: 66,
            screen: (
              <ShareCredentialsSlide
                key="share-credentials"
                onAccept={usePin ? undefined : onAccept}
                onDecline={onDecline}
                logo={logo}
                submission={submission}
                isAccepting={isAccepting}
              />
            ),
          },
          usePin && {
            step: 'pin-enter',
            progress: 82.5,
            screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinComplete={onAcceptWithPin} />,
          },
          {
            step: 'success',
            progress: 100,
            backIsCancel: true,
            screen: <PresentationSuccessSlide verifierName={verifierName} onComplete={onComplete} />,
          },
        ].filter(Boolean) as SlideStep[]
      }
      isError={false}
      onCancel={onDecline}
    />
  )
}
