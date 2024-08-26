import { Button, FlexPage, Heading, HeroIcons, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'
import { useRouter } from 'solito/router'

import { useScrollViewPosition } from '@package/app/src/hooks'

export function FunkeSettingsScreen() {
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const router = useRouter()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="title" fontWeight="$bold">
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
          <Paragraph color="$grey-700">This page is under construction.</Paragraph>
          <Button.Text color="$primary-500" fontWeight="$semiBold" fontSize="$4" onPress={() => router.back()}>
            <HeroIcons.ArrowLeft mr={-4} color="$primary-500" size={20} /> Back
          </Button.Text>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
