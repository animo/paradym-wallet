import { FunkeActivityScreen } from '@easypid/features/activity/FunkeActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { did } = useLocalSearchParams()

  return <FunkeActivityScreen did={did as string} />
}
