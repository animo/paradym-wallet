import { useActivities } from '@easypid/features/activity/activityRecord'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { useCredentialsForDisplay } from '@package/agent'
import { useHaptics } from '@package/app/hooks'
import { InfoButton } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'

const recentActivityTitle = defineMessage({
  id: 'activity.latest.title',
  message: 'Recent activity',
  comment: 'Section title for the latest activity card',
})

const noActivityDescription = defineMessage({
  id: 'activity.latest.noActivity',
  message: 'No activity yet',
  comment: 'Description shown if the user has no activity history',
})

const sharingFailed = defineMessage({
  id: 'activity.latest.sharingFailed',
  message: 'Sharing failed',
  comment: 'Shown if the last sharing activity failed or was stopped',
})

const sharedCard = defineMessage({
  id: 'activity.latest.sharedCard',
  message: 'Shared card',
  comment: 'Shown if a single credential was shared successfully',
})

const sharedCards = defineMessage({
  id: 'activity.latest.sharedCards',
  message: 'Shared cards',
  comment: 'Shown if multiple credentials were shared successfully',
})

const signingFailed = defineMessage({
  id: 'activity.latest.signingFailed',
  message: 'Signing failed',
  comment: 'Shown if signing a document failed or was cancelled',
})

const signedDocument = defineMessage({
  id: 'activity.latest.signedDocument',
  message: 'Signed document',
  comment: 'Shown if a document was signed successfully',
})

const fallbackCardName = defineMessage({
  id: 'activity.latest.newCardFallback',
  message: 'new card',
  comment: 'Fallback name if a received credential has no display name',
})

export function LatestActivityCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const { activities } = useActivities()
  const { t } = useLingui()
  const latestActivity = activities[0]
  const { credentials } = useCredentialsForDisplay()

  const pushToActivity = withHaptics(() => push('/activity'))

  const content = useMemo(() => {
    if (!latestActivity) {
      return {
        title: t(recentActivityTitle),
        description: t(noActivityDescription),
      }
    }

    const date = formatRelativeDate(new Date(latestActivity.date))

    if (latestActivity.type === 'shared') {
      const isPlural = latestActivity.request.credentials.length > 1
      const description = ['failed', 'stopped'].includes(latestActivity.status)
        ? t(sharingFailed)
        : isPlural
          ? t(sharedCards)
          : t(sharedCard)

      return { title: date, description }
    }

    if (latestActivity.type === 'signed') {
      const description = ['failed', 'stopped'].includes(latestActivity.status) ? t(signingFailed) : t(signedDocument)

      return { title: date, description }
    }

    if (latestActivity.type === 'received') {
      const credential = credentials.find((c) => c.id === latestActivity.credentialIds[0])
      const name = credential?.display.name ?? fallbackCardName
      return {
        title: date,
        description: t({
          id: 'activity.latest.addedCard',
          message: `Added ${name}`,
          comment: 'Shown when a new card has been added',
        }),
      }
    }

    return null
  }, [latestActivity, credentials, t])

  if (!content) return null

  return (
    <InfoButton
      ariaLabel={t(recentActivityTitle)}
      noIcon
      title={content.title}
      description={content.description}
      onPress={pushToActivity}
    />
  )
}
