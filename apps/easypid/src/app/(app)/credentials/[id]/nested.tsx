import { FunkeNestedAttributeScreen } from '@easypid/features/wallet/FunkeNestedAttributeScreen'
import type { FormattedAttributeArray, FormattedAttributeObject } from '@package/sdk'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { item, parentName } = useLocalSearchParams<{
    item: string
    parentName?: string
  }>()

  return (
    <FunkeNestedAttributeScreen
      parentName={parentName}
      item={JSON.parse(item) as FormattedAttributeArray | FormattedAttributeObject}
    />
  )
}
