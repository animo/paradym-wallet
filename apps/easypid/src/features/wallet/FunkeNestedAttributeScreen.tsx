import { CredentialAttributes, TextBackButton, useScrollViewPosition } from '@package/app'
import type { FormattedCredentialValue } from '@package/app/src/utils/formatSubject'
import { FlexPage, ScrollView, YStack } from '@package/ui'
import { HeaderContainer } from 'packages/ui/src/content/HeaderContainer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface FunkeNestedAttributeScreenProps {
  name: string
  values: Record<string, FormattedCredentialValue>
}

export function FunkeNestedAttributeScreen({ name, values }: FunkeNestedAttributeScreenProps) {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const { bottom } = useSafeAreaInsets()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer isScrolledByOffset={isScrolledByOffset} title={name} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack px="$4" gap="$4" marginBottom={bottom}>
          <CredentialAttributes subject={values} isFormatted />
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
