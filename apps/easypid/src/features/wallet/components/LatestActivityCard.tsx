import { useActivities } from '@easypid/features/activity/activityRecord'
import { useCredentialsForDisplay } from '@package/agent'
import { InfoButton } from '@package/ui/src'
import { useRouter } from 'expo-router'
import { useHaptics } from 'packages/app/src/hooks'
import { formatRelativeDate } from 'packages/utils/src'
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
        description: `Shared ${isPlural ? 'cards' : 'card'}`,
      }
    }
    if (latestActivity.type === 'received') {
      const credential = credentials.find((c) => c.id === latestActivity.credentialIds[0])
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: `Added ${credential?.display.name}`,
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
