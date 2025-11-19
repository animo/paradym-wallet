import { FunkeRequestedAttributesDetailScreen } from '@easypid/features/share/FunkeRequestedAttributesDetailScreen'
import type { CredentialId } from '@paradym/wallet-sdk/hooks'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { disclosedPayload, disclosedAttributeLength, id } = useLocalSearchParams<{
    disclosedPayload: string
    disclosedAttributeLength: string
    id: CredentialId
  }>()

  return (
    <FunkeRequestedAttributesDetailScreen
      id={id}
      disclosedPayload={JSON.parse(disclosedPayload)}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength, 10)}
    />
  )
}
