import { ActivityRowItem } from '@package/app'
import { TextBackButton } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import {
  AnimatedStack,
  FlexPage,
  HeaderContainer,
  Heading,
  Loader,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  YStack,
} from '@package/ui'
import React, { useMemo } from 'react'
import { FadeInDown } from 'react-native-reanimated'
import { useActivities } from './activityRecord'

export function FunkeActivityScreen({ entityId }: { entityId?: string }) {
  const { activities, isLoading: isLoadingActivities } = useActivities({ filters: { entityId } })

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  const groupedActivities = useMemo(() => {
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
      <HeaderContainer title="Activity" isScrolledByOffset={isScrolledByOffset} />
      {activities.length === 0 ? (
        <AnimatedStack
          flexDirection="column"
          entering={FadeInDown.delay(300).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
          gap="$2"
          jc="center"
          p="$4"
          fg={1}
        >
          <Heading ta="center" variant="h3" fontWeight="$semiBold">
            There's nothing here, yet
          </Heading>
          <Paragraph ta="center">Activity will appear here once you share or receive credentials.</Paragraph>
        </AnimatedStack>
      ) : isLoadingActivities ? (
        <YStack fg={1} ai="center" jc="center">
          <Loader />
          <Spacer size="$12" />
        </YStack>
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
          <YStack fg={1} px="$4" gap="$4">
            {Object.entries(groupedActivities).map(([key, groupActivities]) => {
              const [year, month] = key.split('-')
              const date = new Date(Number.parseInt(year), Number.parseInt(month))
              return (
                <React.Fragment key={key}>
                  <Stack bbw={1} btw={1} borderColor="$grey-200" px="$4" py="$3" mx={-18}>
                    <Heading variant="sub2">
                      {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Heading>
                  </Stack>
                  {groupActivities.map((activity) => (
                    <ActivityRowItem
                      key={activity.id}
                      id={activity.id}
                      logo={activity.entity.logo}
                      backgroundColor={activity.entity.backgroundColor}
                      subtitle={activity.entity.name ?? activity.entity.host ?? 'Unknown party'}
                      date={new Date(activity.date)}
                      type={activity.type}
                      status={activity.status}
                    />
                  ))}
                </React.Fragment>
              )
            })}
          </YStack>
        </ScrollView>
      )}
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
