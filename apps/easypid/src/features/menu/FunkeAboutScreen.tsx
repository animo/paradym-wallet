import { FlexPage, Heading, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'

import { useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app'

export function FunkeAboutScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="h1" fontWeight="$bold">
            About the wallet
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '85%' }}
      >
        <YStack fg={1} px="$4" jc="space-between">
          <Paragraph color="$grey-700">This page is under construction.</Paragraph>
          <TextBackButton />
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
