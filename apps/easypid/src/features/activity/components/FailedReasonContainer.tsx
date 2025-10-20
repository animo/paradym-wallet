import { useLingui } from '@lingui/react/macro'
import type { SharingFailureReason } from '@package/agent'
import { commonMessages } from '@package/translations'
import { HeroIcons, MessageBox } from '@package/ui'

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
    unknown: t(commonMessages.somethingWentWrong),
  }

  return <MessageBox variant="error" message={reasonText[reason]} icon={<HeroIcons.ExclamationCircleFilled />} />
}
