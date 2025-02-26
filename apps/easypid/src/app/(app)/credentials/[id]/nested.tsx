import { FunkeNestedAttributeScreen } from '@easypid/features/wallet/FunkeNestedAttributeScreen'
import type { FormattedCredentialValue } from '@easypid/features/wallet/components/formatSubject'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { name, values } = useLocalSearchParams<{
    name: string
    values: string
  }>()

  return (
    <FunkeNestedAttributeScreen name={name} values={JSON.parse(values) as Record<string, FormattedCredentialValue>} />
  )
}
