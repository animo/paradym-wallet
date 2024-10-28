import type { FormattedSubmission } from '@package/agent'

import { type SlideStep, SlideWizard } from '@package/app'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import type { PresentationRequestResult } from './FunkeOpenIdPresentationNotificationScreen'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface FunkePresentationNotificationScreenProps {
  usePin: boolean
  isAccepting: boolean
  onAccept: () => Promise<PresentationRequestResult>
  onAcceptWithPin: (pin: string) => Promise<PresentationRequestResult>
  onDecline: () => void
  onComplete: () => void
  submission?: FormattedSubmission
  verifierName?: string
}

export function FunkePresentationNotificationScreen({
  usePin,
  onAccept,
  onAcceptWithPin,
  onDecline,
  isAccepting,
  submission,
  verifierName,
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
            // FIXME: Verifier info for proof requests will be added with OpenID Federation
            // For now, it will only use the domain from the request
            screen: <VerifyPartySlide key="verify-issuer" name={verifierName} domain={verifierName as string} />,
          },
          {
            step: 'share-credentials',
            progress: 66,
            screen: (
              <ShareCredentialsSlide
                key="share-credentials"
                onAccept={usePin ? undefined : onAccept}
                onDecline={onDecline}
                verifierName={verifierName}
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
