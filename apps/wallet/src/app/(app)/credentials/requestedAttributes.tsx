import { RequestedAttributesDetailScreen } from '@app/features/share/RequestedAttributesDetailScreen'
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
    <RequestedAttributesDetailScreen
      id={id}
      disclosedPayload={JSON.parse(disclosedPayload) as FormattedAttribute[]}
      disclosedMetadata={disclosedMetadata ? (JSON.parse(disclosedMetadata) as CredentialMetadata) : undefined}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength, 10)}
    />
  )
}
