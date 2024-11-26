import { FunkeFederationDetailScreen } from '@easypid/features/wallet/FunkeFederationDetailScreen'
import { useLocalSearchParams } from 'expo-router'
import type { TrustedEntity } from 'packages/agent/src/invitation/handler'

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
