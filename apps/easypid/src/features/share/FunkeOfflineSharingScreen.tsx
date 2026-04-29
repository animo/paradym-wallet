import type { OnWalletAuthSubmitProps } from '@easypid/components/WalletFlowAuthPrompt'
import { type SlideStep, SlideWizard } from '@package/app'
import type { FormattedSubmission } from '@paradym/wallet-sdk'
import type { SubmissionAuthorizationMode } from '../../hooks/useSubmissionAuthorizationMode'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'
import { WalletAuthSlide } from './slides/WalletAuthSlide'

interface FunkeOfflineSharingScreenProps {
  submission?: FormattedSubmission
  authorizationMode: SubmissionAuthorizationMode
  isAccepting: boolean
  onAccept: (props?: OnWalletAuthSubmitProps) => Promise<void>
  onDecline: () => void
  onComplete: () => void
}

export function FunkeOfflineSharingScreen({
  submission,
  authorizationMode,
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
                onAccept={authorizationMode === 'none' ? onAccept : undefined}
                submission={submission as FormattedSubmission}
                onDecline={onDecline}
                isAccepting={isAccepting}
                isOffline
              />
            ),
          },
          authorizationMode !== 'none' && {
            step: 'pin-enter',
            progress: 80,
            screen: (
              <WalletAuthSlide
                key="pin-enter"
                authMode={authorizationMode}
                isLoading={isAccepting}
                onSubmit={onAccept}
              />
            ),
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
