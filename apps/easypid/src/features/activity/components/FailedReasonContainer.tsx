import { HeroIcons, MessageBox } from '@package/ui'
import type { SharingFailureReason } from '../activityRecord'
import { useLingui } from '@lingui/react/macro'

interface FailedReasonContainerProps {
  reason: SharingFailureReason
}

export function FailedReasonContainer({ reason }: FailedReasonContainerProps) {
  const { t } = useLingui()

  const reasonText: Record<SharingFailureReason, string> = {
    missing_credentials: t({
      id: 'sharing.failed.missingCredentials',
      message: 'You did not have the required credentials to disclose.',
      comment: 'Displayed when the user tries to share but lacks the needed credentials',
    }),
    unknown: t({
      id: 'sharing.failed.unknown',
      message: 'Something went wrong.',
      comment: 'Displayed when sharing fails due to an unknown reason',
    }),
  }

  return <MessageBox variant="error" message={reasonText[reason]} icon={<HeroIcons.ExclamationCircleFilled />} />
}