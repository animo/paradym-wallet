import { TrustDetailScreen } from '@app/features/wallet/TrustDetailScreen'
import type { TrustedEntity, TrustMechanism } from '@paradym/wallet-sdk'
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
    <TrustDetailScreen
      name={name}
      logo={logo}
      trustedEntities={trustedEntitiesArray}
      trustMechanism={trustMechanism}
      isDemoTrustedEntity={isDemoTrustedEntity === 'true'}
    />
  )
}
