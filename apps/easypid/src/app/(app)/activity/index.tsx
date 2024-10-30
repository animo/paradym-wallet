import { FunkeActivityScreen } from '@easypid/features/activity/FunkeActivityScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { host, name } = useLocalSearchParams()

  return <FunkeActivityScreen host={host as string} name={name as string} />
}
