import type { DisplayImage, FormattedSubmission, FormattedTransactionData, TrustedEntity } from '@package/agent'

import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { type SlideStep, SlideWizard } from '@package/app'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { VerifyPartySlide } from '../receive/slides/VerifyPartySlide'
import { PinSlide } from './slides/PinSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'
import { SignAndShareSlide } from './slides/SignAndShareSlide'
import { SigningSlide } from './slides/SigningSlide'

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
  transaction?: FormattedTransactionData
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
  transaction,
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
                type={transaction?.type === 'qes_authorization' ? 'signing' : 'request'}
                entityId={entityId}
                name={verifierName}
                logo={logo}
                lastInteractionDate={lastInteractionDate}
                trustedEntities={trustedEntities}
              />
            ),
          },
          ...(submission
            ? transaction?.type === 'qes_authorization'
              ? [
                  {
                    step: 'signing',
                    progress: 50,
                    screen: <SigningSlide qtsp={transaction.qtsp} documentName={transaction.documentName} />,
                  },
                  {
                    step: 'share-credentials',
                    progress: 66,
                    screen: (
                      <SignAndShareSlide
                        key="sign-and-share-credentials"
                        onAccept={usePin ? undefined : onAccept}
                        onDecline={onDecline}
                        isAccepting={isAccepting}
                        qtsp={transaction.qtsp}
                        documentName={transaction.documentName}
                        cardForSigningId={transaction.cardForSigningId}
                        submission={submission}
                      />
                    ),
                  },
                ]
              : [
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
                        overAskingResponse={overAskingResponse}
                      />
                    ),
                  },
                ]
            : []),
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
