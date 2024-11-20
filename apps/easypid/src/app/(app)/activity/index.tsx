import { FunkeActivityScreen } from '@easypid/features/activity/FunkeActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { entityId } = useLocalSearchParams<{ entityId?: string }>()

  return <FunkeActivityScreen entityId={entityId} />
}
