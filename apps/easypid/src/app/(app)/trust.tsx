import { FunkeTrustDetailScreen } from '@easypid/features/wallet/FunkeTrustDetailScreen'
import type { TrustMechanism, TrustedEntity } from '@paradym/wallet-sdk/trust/trustMechanism'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { trustedEntities, name, logo, trustMechanism, isDemoTrustedEntity } = useLocalSearchParams<{
    trustedEntities: string
    trustMechanism: TrustMechanism
    name: string
    logo: string
    isDemoTrustedEntity?: string
  }>()

  const trustedEntitiesArray = JSON.parse(decodeURIComponent(trustedEntities)) as Array<TrustedEntity>

  return (
    <FunkeTrustDetailScreen
      name={name}
      logo={logo}
      trustedEntities={trustedEntitiesArray}
      trustMechanism={trustMechanism}
      isDemoTrustedEntity={isDemoTrustedEntity === 'true'}
    />
  )
}
