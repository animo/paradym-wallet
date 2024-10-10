import { FunkeRequestedAttributesDetailScreen } from '@easypid/features/share/FunkeRequestedAttributesDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { disclosedPayload, disclosedAttributeLength, id } = useLocalSearchParams<{
    disclosedPayload: string
    disclosedAttributeLength: string
    id: string
  }>()

  return (
    <FunkeRequestedAttributesDetailScreen
      id={id}
      disclosedPayload={JSON.parse(disclosedPayload)}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength)}
    />
  )
}
