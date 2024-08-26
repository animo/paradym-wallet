import { ActivityRowItem, FlexPage, Heading, ScrollView, Spinner, Stack, YStack } from '@package/ui'
import React from 'react'

import { useScrollViewPosition } from '@package/app/src/hooks'
import { TextBackButton } from 'packages/app/src'
import { useActivities } from './activityRecord'

export function FunkeActivityScreen() {
  const { activities, isLoading: isLoadingActivities } = useActivities()

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="title" fontWeight="$bold">
            Activity
          </Heading>
        </YStack>
      </YStack>
      {isLoadingActivities ? (
        <YStack fg={1} ai="center" jc="center">
          <Spinner />
        </YStack>
      ) : (
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{ minHeight: '85%' }}
        >
          <YStack fg={1} px="$4" jc="space-between">
            <YStack gap="$4" pt="$4">
              {activities.map((activity) => (
                <ActivityRowItem
                  key={activity.id}
                  id={activity.id}
                  title={activity.type === 'shared' ? 'Shared data' : 'Received digital identity'}
                  subtitle={activity.entityName ?? activity.entityHost}
                  date={new Date(activity.date)}
                  type={activity.type}
                />
              ))}
            </YStack>
            <TextBackButton />
          </YStack>
        </ScrollView>
      )}
    </FlexPage>
  )
}
