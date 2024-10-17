import { FunkeCredentialDetailAttributesScreen } from '@easypid/features/wallet/FunkeCredentialDetailAttributesScreen'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { attributes, metadata } = useLocalSearchParams<{
    attributes: string
    metadata: string
  }>()

  return <FunkeCredentialDetailAttributesScreen attributes={JSON.parse(attributes)} metadata={JSON.parse(metadata)} />
}
