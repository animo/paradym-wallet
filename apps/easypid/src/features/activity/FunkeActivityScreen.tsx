import { ActivityRowItem } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { FlexPage, Heading, Paragraph, ScrollView, Spinner, Stack, YStack } from '@package/ui'
import { TextBackButton } from 'packages/app/src'
import React from 'react'
import { useActivities } from './activityRecord'

export function FunkeActivityScreen() {
  const { activities, isLoading: isLoadingActivities } = useActivities()

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  const groupedActivities = React.useMemo(() => {
    return activities.reduce(
      (acc, activity) => {
        const date = new Date(activity.date)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(activity)
        return acc
      },
      {} as Record<string, typeof activities>
    )
  }, [activities])

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <YStack w="100%" top={0} borderBottomWidth={0.5} borderColor={isScrolledByOffset ? '$grey-300' : '$background'}>
        <YStack gap="$4" p="$4">
          <Stack h="$1" />
          <Heading variant="h1" fontWeight="$bold">
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
          <YStack fg={1} px="$4" gap="$4" jc="space-between">
            <YStack gap="$4">
              {Object.entries(groupedActivities).map(([key, groupActivities]) => {
                const [year, month] = key.split('-')
                const date = new Date(Number.parseInt(year), Number.parseInt(month))
                return (
                  <React.Fragment key={key}>
                    <Stack bbw={1} btw={1} borderColor="$grey-200" px="$4" py="$3" mx={-18}>
                      <Heading variant="h3" fontWeight="$semiBold">
                        {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </Heading>
                    </Stack>
                    {groupActivities.map((activity) => (
                      <ActivityRowItem
                        key={activity.id}
                        id={activity.id}
                        subtitle={activity.entityName ?? activity.entityHost}
                        date={new Date(activity.date)}
                        type={activity.type}
                      />
                    ))}
                  </React.Fragment>
                )
              })}
            </YStack>
            <TextBackButton />
          </YStack>
        </ScrollView>
      )}
    </FlexPage>
  )
}
