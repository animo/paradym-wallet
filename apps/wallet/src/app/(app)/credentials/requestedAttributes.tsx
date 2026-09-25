import { RequestedAttributesDetailScreen } from '@app/features/share/RequestedAttributesDetailScreen'
import type { ClaimPath, CredentialForDisplayId } from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'

export default function Screen() {
  const { paths, disclosedAttributeLength, id } = useLocalSearchParams<{
    paths: string
    disclosedAttributeLength: string
    id: CredentialForDisplayId
  }>()

  // Parsed once, as the screen derives the attributes from them
  const disclosedPaths = useMemo(() => JSON.parse(paths) as ClaimPath[], [paths])

  return (
    <RequestedAttributesDetailScreen
      id={id}
      disclosedPaths={disclosedPaths}
      disclosedAttributeLength={Number.parseInt(disclosedAttributeLength, 10)}
    />
  )
}
