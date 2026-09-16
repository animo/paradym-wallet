import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { ActivityRowItem, TextBackButton, useScrollViewPosition } from '@package/app'
import { commonMessages } from '@package/translations'
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
import { useActivities } from '@paradym/wallet-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { FadeInDown } from 'react-native-reanimated'

const activityMessages = {
  screenTitle: commonMessages.activity,
  noActivityTitle: commonMessages.nothingHereYet,
  noActivityDescription: defineMessage({
    id: 'activity.emptyDescription',
    message: 'Activity will appear here once you share or receive credentials.',
    comment: 'Shown below the empty activity title to explain why the list is empty',
  }),
}

/** How many more activities are read each time the list reaches its end. */
const activityPageSize = 50

export function ActivityScreen({ entityId }: { entityId?: string }) {
  const [limit, setLimit] = useState(activityPageSize)
  const { activities, isLoading: isLoadingActivities, hasMore } = useActivities({ filters: { entityId }, limit })
  const { t, i18n } = useLingui()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  // The whole history is still reachable — it is just read a page at a time, rather than every
  // activity record being read to render the first screenful.
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      handleScroll(event)

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      const isNearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - layoutMeasurement.height

      // Only once the page that is on screen is full, so scrolling while one is still loading does
      // not ask for several at once.
      if (isNearEnd && hasMore && activities.length >= limit) {
        setLimit((current) => current + activityPageSize)
      }
    },
    [handleScroll, hasMore, activities.length, limit]
  )

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
      <HeaderContainer title={t(activityMessages.screenTitle)} isScrolledByOffset={isScrolledByOffset} />

      {activities.length === 0 ? (
        <AnimatedStack
          flexDirection="column"
          entering={FadeInDown.delay(300).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
          gap="$2"
          jc="center"
          p="$4"
          fg={1}
        >
          <Heading ta="center" heading="h3" fontWeight="$semiBold">
            {t(activityMessages.noActivityTitle)}
          </Heading>
          <Paragraph ta="center">{t(activityMessages.noActivityDescription)}</Paragraph>
        </AnimatedStack>
      ) : isLoadingActivities ? (
        <YStack fg={1} ai="center" jc="center">
          <Loader />
          <Spacer size="$12" />
        </YStack>
      ) : (
        <ScrollView onScroll={onScroll} scrollEventThrottle={scrollEventThrottle}>
          <YStack fg={1} px="$4" gap="$4">
            {Object.entries(groupedActivities).map(([key, groupActivities]) => {
              const [year, month] = key.split('-')
              const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10))
              return (
                <React.Fragment key={key}>
                  <Stack bbw={1} btw={1} borderColor="$grey-200" px="$4" py="$3" mx={-18}>
                    <Heading heading="sub2">
                      {date.toLocaleString(i18n.locale, { month: 'long', year: 'numeric' })}
                    </Heading>
                  </Stack>
                  {groupActivities.map((activity) => (
                    <ActivityRowItem activity={activity} key={activity.id} />
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
