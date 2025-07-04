import { useActivities } from '@easypid/features/activity/activityRecord'
import { useCredentialsForDisplay } from '@package/agent'
import { useHaptics } from '@package/app/hooks'
import { InfoButton } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'

export function LatestActivityCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const { activities } = useActivities()
  const latestActivity = activities[0]
  const { credentials } = useCredentialsForDisplay()

  const pushToActivity = withHaptics(() => push('/activity'))

  const content = useMemo(() => {
    if (!latestActivity)
      return {
        title: 'Recent activity',
        description: 'No activity yet',
      }
    if (latestActivity.type === 'shared') {
      const isPlural = latestActivity.request.credentials.length > 1
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: ['failed', 'stopped'].includes(latestActivity.status)
          ? `Sharing ${latestActivity.status}`
          : `Shared ${isPlural ? 'cards' : 'card'}`,
      }
    }
    if (latestActivity.type === 'signed') {
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: ['failed', 'stopped'].includes(latestActivity.status)
          ? `Signing ${latestActivity.status}`
          : 'Signed document',
      }
    }
    if (latestActivity.type === 'received') {
      const credential = credentials.find((c) => c.id === latestActivity.credentialIds[0])
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: `Added ${credential?.display.name ?? 'new card'}`,
      }
    }
    return null
  }, [latestActivity, credentials])

  if (!content) return null

  return (
    <InfoButton
      ariaLabel="Recent activity"
      noIcon
      title={content.title}
      description={content.description}
      onPress={pushToActivity}
    />
  )
}
