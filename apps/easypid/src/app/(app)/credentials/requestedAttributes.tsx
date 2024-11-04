import { FunkeRequestedAttributesDetailScreen } from '@easypid/features/share/FunkeRequestedAttributesDetailScreen'
import type { CredentialForDisplayId } from '@package/agent'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { disclosedPayload, disclosedAttributeLength, id } = useLocalSearchParams<{
    disclosedPayload: string
    disclosedAttributeLength: string
    id: CredentialForDisplayId
  }>()

  return (
    <FunkeRequestedAttributesDetailScreen
      id={id}
      disclosedPayload={JSON.parse(disclosedPayload)}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength)}
    />
  )
}
