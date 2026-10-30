import { ActivityDetailScreen } from '@app/features/activity/ActivityDetailScreen'
import { ActivityScreen } from '@app/features/activity/ActivityScreen'
import { useMedia } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const media = useMedia()

  // Wide windows show the activity next to the list of activities
  return media.wide ? <ActivityScreen initialSelectedId={id} /> : <ActivityDetailScreen />
}
