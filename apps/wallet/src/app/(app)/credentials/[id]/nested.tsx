import { NestedAttributeScreen } from '@app/features/wallet/NestedAttributeScreen'
import type { FormattedAttributeArray, FormattedAttributeObject } from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { item, parentName } = useLocalSearchParams<{
    item: string
    parentName?: string
  }>()

  return (
    <NestedAttributeScreen
      parentName={parentName}
      item={JSON.parse(item) as FormattedAttributeArray | FormattedAttributeObject}
    />
  )
}
