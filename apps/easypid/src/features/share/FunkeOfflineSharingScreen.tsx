import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { type SlideStep, SlideWizard, useWizard } from '@package/app'
import type { FormattedSubmission } from '@paradym/wallet-sdk'
import type { SubmissionAuthorizationMode } from '../../hooks/useSubmissionAuthorizationMode'
import { LoadingRequestSlide } from '../receive/slides/LoadingRequestSlide'
import { PresentationSuccessSlide } from './slides/PresentationSuccessSlide'
import { ShareCredentialsSlide } from './slides/ShareCredentialsSlide'

type OfflineWalletAuthStepProps = {
  authMode: Exclude<SubmissionAuthorizationMode, 'none'>
  isLoading: boolean
  onSubmit: (props: OnWalletAuthSubmitProps) => Promise<void>
}

function OfflineWalletAuthStep({ authMode, onSubmit, isLoading }: OfflineWalletAuthStepProps) {
  const { onNext } = useWizard()

  return (
    <WalletFlowAuthPrompt
      authMode={authMode}
      isLoading={isLoading}
      onSubmit={(props) => onSubmit({ ...props, onAuthorized: onNext })}
    />
  )
}

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
              <OfflineWalletAuthStep
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
