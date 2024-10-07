import { FlexPage, Heading, IdCard, Paragraph, ScrollView, Spacer, Stack, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { CredentialAttributes, TextBackButton, activityTitleMap } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import germanIssuerImage from '../../../assets/german-issuer-image.png'
import { useActivities } from './activityRecord'

const { useParams } = createParam<{ id: string }>()

// When it's a credential, it should render a credential detail screen.
// As we only have the PID credential this is currently not needed to implement.
// So the activity detail screen is always a 'shared data' screen.

export function FunkeActivityDetailScreen() {
  const { params } = useParams()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const { activities } = useActivities()
  const activity = activities.find((activity) => activity.id === params.id)

  if (!activity) {
    router.back()
    return
  }

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage p={0} gap={0}>
      <YStack borderWidth="$0.5" p="$4" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" p="$4" marginBottom={bottom}>
          {activity.disclosedPayload ? (
            <>
              <Stack gap="$2">
                <Heading variant="h1">{activityTitleMap[activity.type]}</Heading>
                <Paragraph color="$grey-700">
                  You have shared this data with {activity.entityName ?? activity.entityHost} on{' '}
                  {new Date(activity.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  .
                </Paragraph>
              </Stack>
              <CredentialAttributes disableHeader subject={activity.disclosedPayload} headerStyle="small" />
            </>
          ) : (
            <Paragraph>Disclosed information could not be shown.</Paragraph>
          )}
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
