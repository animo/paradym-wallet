import { FunkePidRequestedAttributesDetailScreen } from '@easypid/features/wallet/FunkePidRequestedAttributesDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { requestedAttributes } = useLocalSearchParams<{ requestedAttributes: string }>()

  return (
    <FunkePidRequestedAttributesDetailScreen
      requestedAttributes={requestedAttributes ? JSON.parse(requestedAttributes) : []}
    />
  )
}
