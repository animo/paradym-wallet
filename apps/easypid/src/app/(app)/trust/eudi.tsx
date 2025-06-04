import { FunkeEudiTrustDetailScreen } from '@easypid/features/wallet/FunkeEudiTrustDetailScreen'
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
    <FunkeEudiTrustDetailScreen
      name={name}
      logo={logo}
      trustedEntities={trustedEntitiesArray}
      trustMechanism="eudi_rp_authentication"
    />
  )
}
