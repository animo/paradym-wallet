import { ActivityScreen } from '@app/features/activity/ActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { entityId } = useLocalSearchParams<{ entityId?: string }>()

  return <ActivityScreen entityId={entityId} />
}
