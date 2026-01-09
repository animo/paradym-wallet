import type { FormattedAttributeArray, FormattedAttributeObject } from '@package/agent'
import { CredentialAttributes, TextBackButton, useScrollViewPosition } from '@package/app'
import { FlexPage, ScrollView, YStack } from '@package/ui'
import { HeaderContainer } from '@package/ui/content/HeaderContainer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeNestedAttributeScreenProps {
  item: FormattedAttributeArray | FormattedAttributeObject
  parentName?: string
}

export function FunkeNestedAttributeScreen({ item, parentName }: FunkeNestedAttributeScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()

  return (
    <FlexPage gap={0} paddingHorizontal={0}>
      <HeaderContainer isScrolledByOffset={isScrolledByOffset} title={item.label} subtitle={parentName} />
      <ScrollView pt="$4" onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="$4" gap="$4" marginBottom={bottom}>
          <CredentialAttributes attributes={item.value} />
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
