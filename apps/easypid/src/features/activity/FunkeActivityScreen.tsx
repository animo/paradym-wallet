import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { ActivityRowItem, TextBackButton, useScrollViewPosition } from '@package/app'
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
import React, { useMemo } from 'react'
import { FadeInDown } from 'react-native-reanimated'

const activityMessages = {
  screenTitle: defineMessage({
    id: 'activity.title',
    message: 'Activity',
    comment: 'Title of the activity screen showing shared or received credentials',
  }),
  noActivityTitle: defineMessage({
    id: 'activity.emptyTitle',
    message: "There's nothing here, yet",
    comment: 'Shown when the user has no activity items yet',
  }),
  noActivityDescription: defineMessage({
    id: 'activity.emptyDescription',
    message: 'Activity will appear here once you share or receive credentials.',
    comment: 'Shown below the empty activity title to explain why the list is empty',
  }),
}

export function FunkeActivityScreen({ entityId }: { entityId?: string }) {
  const { activities, isLoading: isLoadingActivities } = useActivities({ filters: { entityId } })
  const { t, i18n } = useLingui()
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
        <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
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
