import { FunkeFederationTrustDetailScreen } from '@easypid/features/wallet/FunkeFederationDetailScreen'
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
    <FunkeFederationTrustDetailScreen
      trustedEntities={trustedEntitiesArray}
      name={name}
      logo={logo}
      trustMechanism="openid_federation"
    />
  )
}
