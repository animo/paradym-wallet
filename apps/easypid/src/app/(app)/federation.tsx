import { FunkeFederationDetailScreen } from '@easypid/features/wallet/FunkeFederationDetailScreen'
import type { TrustedEntity } from '@package/agent'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { entityId, trustedEntities, name, logo } = useLocalSearchParams()

  const trustedEntitiesArray = JSON.parse(decodeURIComponent(trustedEntities as string)) as Array<TrustedEntity>

  return (
    <FunkeFederationDetailScreen
      entityId={entityId as string}
      trustedEntities={trustedEntitiesArray}
      name={name as string}
      logo={logo as string}
    />
  )
}
