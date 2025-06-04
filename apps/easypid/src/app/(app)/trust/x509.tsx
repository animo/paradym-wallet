import { FunkeX509TrustDetailScreen } from '@easypid/features/wallet/FunkeX509TrustDetailScreen'
import type { TrustedEntity } from '@package/agent'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { trustedEntities, name, logo } = useLocalSearchParams<{
    trustedEntities: string
    name: string
    logo: string
  }>()

  const trustedEntitiesArray = JSON.parse(decodeURIComponent(trustedEntities)) as Array<TrustedEntity>

  return (
    <FunkeX509TrustDetailScreen trustedEntities={trustedEntitiesArray} name={name} logo={logo} trustMechanism="x509" />
  )
}
