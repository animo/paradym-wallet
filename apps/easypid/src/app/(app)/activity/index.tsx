import { FunkeActivityScreen } from '@easypid/features/activity/FunkeActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { host } = useLocalSearchParams()

  return <FunkeActivityScreen host={host as string} />
}
