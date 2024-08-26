import { FlexPage, Heading, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { TextBackButton } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'

const { useParams } = createParam<{ id: string }>()

export function FunkeActivityDetailScreen() {
  const { params } = useParams()

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="title" fontWeight="$bold">
            Activity detail
          </Heading>
        </YStack>
      </YStack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ minHeight: '85%' }}
      >
        <YStack fg={1} px="$4" jc="space-between">
          <Paragraph color="$grey-700">This page is under construction. ({params.id})</Paragraph>
          <TextBackButton />
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
