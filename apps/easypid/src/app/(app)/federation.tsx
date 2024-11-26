import { FunkeFederationDetailScreen } from '@easypid/features/wallet/FunkeFederationDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { entityId, trustedEntityIds, name, logo } = useLocalSearchParams()

  const trustedEntityIdsArray = Array.isArray(trustedEntityIds) ? trustedEntityIds : trustedEntityIds?.split(',') ?? []

  return (
    <FunkeFederationDetailScreen
      entityId={entityId as string}
      trustedEntityIds={trustedEntityIdsArray}
      name={name as string}
      logo={logo as string}
    />
  )
}
