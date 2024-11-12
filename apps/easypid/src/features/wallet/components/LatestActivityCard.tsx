import { useLatestActivity } from '@easypid/features/activity/activityRecord'
import { useCredentialsWithCustomDisplay } from '@easypid/hooks/useCredentialsWithCustomDisplay'
import { InfoButton } from '@package/ui/src'
import { useRouter } from 'expo-router'
import { useHaptics } from 'packages/app/src/hooks'
import { formatRelativeDate } from 'packages/utils/src'
import { useMemo } from 'react'

export function LatestActivityCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const latestActivity = useLatestActivity()
  const { credentials } = useCredentialsWithCustomDisplay()

  const pushToActivity = withHaptics(() => push('/activity'))

  const content = useMemo(() => {
    if (!latestActivity) return null
    if (latestActivity.type === 'shared') {
      const isPlural = latestActivity.request.credentials.length > 1
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: `Shared ${isPlural ? 'cards' : 'card'}`,
      }
    }
    if (latestActivity.type === 'received') {
      const credential = credentials.find((c) => c.id.includes(latestActivity.credentialIds[0]))
      return {
        title: formatRelativeDate(new Date(latestActivity.date)),
        description: `Added ${credential?.display.name ?? '1 card'}`,
      }
    }
    return null
  }, [latestActivity, credentials])

  if (!content) return null

  return <InfoButton noIcon title={content.title} description={content.description} onPress={pushToActivity} />
}
