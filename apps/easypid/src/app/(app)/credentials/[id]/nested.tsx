import { FunkeNestedAttributeScreen } from '@easypid/features/wallet/FunkeNestedAttributeScreen'
import type { FormattedCredentialValueArray, FormattedCredentialValueObject } from '@package/app/utils/formatSubject'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { item, parentName } = useLocalSearchParams<{
    item: string
    parentName?: string
  }>()

  return (
    <FunkeNestedAttributeScreen
      parentName={parentName}
      item={JSON.parse(item) as FormattedCredentialValueArray | FormattedCredentialValueObject}
    />
  )
}
