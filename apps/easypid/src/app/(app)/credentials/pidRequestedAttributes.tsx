import { FunkePidRequestedAttributesDetailScreen } from '@easypid/features/wallet/FunkePidRequestedAttributesDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { disclosedPayload, disclosedAttributeLength } = useLocalSearchParams<{
    disclosedPayload: string
    disclosedAttributeLength: string
  }>()

  return (
    <FunkePidRequestedAttributesDetailScreen
      disclosedPayload={JSON.parse(disclosedPayload)}
      disclosedAttributeLength={disclosedAttributeLength}
    />
  )
}
