import { FunkeIssuerDetailScreen } from '@easypid/features/wallet/FunkeIssuerDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { host } = useLocalSearchParams()

  return <FunkeIssuerDetailScreen host={host as string} />
}
