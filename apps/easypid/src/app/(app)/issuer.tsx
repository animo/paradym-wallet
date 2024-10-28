import { FunkeIssuerDetailScreen } from '@easypid/features/wallet/FunkeIssuerDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { domain } = useLocalSearchParams()

  return <FunkeIssuerDetailScreen domain={domain as string} />
}
