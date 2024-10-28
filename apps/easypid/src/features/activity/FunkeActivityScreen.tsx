import { ActivityRowItem } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { AnimatedStack, FlexPage, Heading, Loader, Paragraph, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import { TextBackButton } from 'packages/app/src'
import React, { useMemo } from 'react'
import { FadeInDown } from 'react-native-reanimated'
import { useActivities } from './activityRecord'

export function FunkeActivityScreen({ host }: { host?: string }) {
  const { activities, isLoading: isLoadingActivities } = useActivities({ filters: { host } })

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
      <YStack w="100%" top={0} borderBottomWidth="$0.5" borderColor={isScrolledByOffset ? '$grey-200' : '$background'}>
        <YStack gap="$2" p="$4">
          <Stack h="$1" />
          <Heading variant="h1">Activity</Heading>
        </YStack>
      </YStack>
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
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{ minHeight: '85%' }}
        >
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
                      subtitle={activity.entity.name ?? activity.entity.host ?? 'Unknown'}
                      date={new Date(activity.date)}
                      type={activity.type}
                      status={activity.status}
                      // FIXME: Handle multiple credentials received in one request
                      credentialId={activity.type === 'received' ? activity.credentialIds?.[0] : undefined}
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
