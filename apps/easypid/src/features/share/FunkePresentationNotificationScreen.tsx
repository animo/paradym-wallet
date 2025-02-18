import type { DisplayImage, FormattedSubmission, TrustedEntity } from '@package/agent'

import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { type SlideStep, SlideWizard } from '@package/app'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

interface FunkePresentationNotificationScreenProps {
  entityId: string
  verifierName?: string
  logo?: DisplayImage
  lastInteractionDate?: string
  overAskingResponse?: OverAskingResponse
  trustedEntities?: Array<TrustedEntity>
  submission?: FormattedSubmission
  usePin: boolean
  isAccepting: boolean
  onAccept: () => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

export function FunkePresentationNotificationScreen({
  entityId,
  verifierName,
  logo,
  lastInteractionDate,
  usePin,
  onAccept,
  onDecline,
  isAccepting,
  submission,
  onComplete,
  overAskingResponse,
  trustedEntities,
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
                entityId={entityId}
                name={verifierName}
                logo={logo}
                lastInteractionDate={lastInteractionDate}
                trustedEntities={trustedEntities}
              />
            ),
          },
          submission && {
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
                overAskingResponse={overAskingResponse}
              />
            ),
          },
          usePin && {
            step: 'pin-enter',
            progress: 82.5,
            screen: <PinSlide key="pin-enter" isLoading={isAccepting} onPinSubmit={onAccept} />,
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
