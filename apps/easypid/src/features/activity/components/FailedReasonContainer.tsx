import { HeroIcons, MessageBox } from '@package/ui'
import type { SharingFailureReason } from '@paradym/wallet-sdk/src/storage/activities'

interface FailedReasonContainerProps {
  reason: SharingFailureReason
}

const reasonText: Record<SharingFailureReason, string> = {
  missing_credentials: 'You did not have the required credentials to disclose.',
  unknown: 'Something went wrong.',
}

export function FailedReasonContainer({ reason }: FailedReasonContainerProps) {
  return <MessageBox variant="error" message={reasonText[reason]} icon={<HeroIcons.ExclamationCircleFilled />} />
}
