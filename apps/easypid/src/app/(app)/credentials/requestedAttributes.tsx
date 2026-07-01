import { FunkeRequestedAttributesDetailScreen } from '@easypid/features/share/FunkeRequestedAttributesDetailScreen'
import type { CredentialId, CredentialMetadata, FormattedAttribute } from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { disclosedPayload, disclosedMetadata, disclosedAttributeLength, id } = useLocalSearchParams<{
    disclosedPayload: string
    disclosedMetadata?: string
    disclosedAttributeLength: string
    id: CredentialId
  }>()

  return (
    <FunkeRequestedAttributesDetailScreen
      id={id}
      disclosedPayload={JSON.parse(disclosedPayload) as FormattedAttribute[]}
      disclosedMetadata={disclosedMetadata ? (JSON.parse(disclosedMetadata) as CredentialMetadata) : undefined}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength, 10)}
    />
  )
}
