import { FlexPage, Heading, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'

import { useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app/src'
import { LocalAiContainer } from './components/LocalAiContainer'

export function FunkeSettingsScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="h1" fontWeight="$bold">
            Settings
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '85%' }}
      >
        <YStack fg={1} px="$4" jc="space-between">
          <YStack gap="$4" py="$2">
            <LocalAiContainer />
          </YStack>

          <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
            <TextBackButton />
          </YStack>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
