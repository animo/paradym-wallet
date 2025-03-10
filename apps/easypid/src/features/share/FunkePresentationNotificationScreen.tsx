import type { DisplayImage, FormattedSubmission, TrustedEntity } from '@package/agent'

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
  transaction?: {
    type: 'qes'
    documentName: string
    qtspName: string
    qtspLogo?: string
  }
  onAccept: () => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

// QES Implementation

// Het wordt een reguliere request waarin we dan een transactions array krijgen
// Elke transaction heeft een type, daarmee kunnen we de juiste screen renderen
// En dit is de share flow
// Dus we moeten daar specifieke slides renderen op basis van deze transactions
// Nu dus QES, later ook voor payments.

// Je gebruikt je PID om te signen, en daar kunnen alle attributen inzitten
// In de toekomst kan je ook meerdere credentials vragen, waarbij dan de PID wordt gebruikt om te signen en de andere niet

// TODO:
// - Activity events for QES sharing

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
                type={transaction?.type === 'qes' ? 'signing' : 'request'}
                entityId={entityId}
                name={verifierName}
                logo={logo}
                lastInteractionDate={lastInteractionDate}
                trustedEntities={trustedEntities}
              />
            ),
          },
          ...(submission
            ? transaction?.type === 'qes'
              ? [
                  {
                    step: 'signing',
                    progress: 50,
                    screen: <SigningSlide qtspName={transaction.qtspName} documentName={transaction.documentName} />,
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
                        qtspName={transaction.qtspName}
                        qtspLogo={transaction.qtspLogo}
                        documentName={transaction.documentName}
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
