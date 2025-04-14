import { FunkeFederationDetailScreen } from '@easypid/features/wallet/FunkeFederationDetailScreen'
import type { TrustedEntity } from '@package/agent'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { trustedEntities, name, logo } = useLocalSearchParams<{
    trustedEntities: string
    name: string
    logo?: string
  }>()

  const trustedEntitiesArray = JSON.parse(decodeURIComponent(trustedEntities as string)) as Array<TrustedEntity>

  return (
    <FunkeFederationDetailScreen trustedEntities={trustedEntitiesArray} name={name as string} logo={logo as string} />
  )
}
