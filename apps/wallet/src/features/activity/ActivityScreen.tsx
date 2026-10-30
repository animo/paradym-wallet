import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { ActivityRowItem, BackFooter, useScrollViewPosition } from '@package/app'
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
  TwoPane,
  useMedia,
  YStack,
} from '@package/ui'
import { useActivities, useActivityById } from '@paradym/wallet-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { FadeInDown } from 'react-native-reanimated'
import { ActivityDetail } from './ActivityDetailScreen'

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

export function ActivityScreen({ entityId, initialSelectedId }: { entityId?: string; initialSelectedId?: string }) {
  const [limit, setLimit] = useState(activityPageSize)
  const { activities, isLoading: isLoadingActivities, hasMore } = useActivities({ filters: { entityId }, limit })
  const { t, i18n } = useLingui()
  const media = useMedia()
  const [selectedId, setSelectedId] = useState(initialSelectedId)

  // Wide windows show the selected activity next to the list, or the latest one when none is selected
  const isSplit = media.wide && activities.length > 0
  const selectedActivityId = isSplit ? (selectedId ?? activities[0].id) : undefined
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

  const list = (
    <>
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
                    <ActivityRowItem
                      activity={activity}
                      key={activity.id}
                      isSelected={activity.id === selectedActivityId}
                      onPress={isSplit ? () => setSelectedId(activity.id) : undefined}
                    />
                  ))}
                </React.Fragment>
              )
            })}
          </YStack>
        </ScrollView>
      )}
    </>
  )

  return (
    <FlexPage gap="$0" paddingHorizontal="$0" {...(isSplit && { maxWidth: '100%' })}>
      {selectedActivityId ? (
        <TwoPane start={list} end={<SelectedActivityDetail key={selectedActivityId} id={selectedActivityId} />} />
      ) : (
        list
      )}
      <BackFooter />
    </FlexPage>
  )
}

// Read by id, so an activity that isn't in the loaded pages of the list can still be shown
function SelectedActivityDetail({ id }: { id: string }) {
  const { activity } = useActivityById(id)

  return activity ? <ActivityDetail activity={activity} /> : null
}
