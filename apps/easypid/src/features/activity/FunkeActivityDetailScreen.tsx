import { FlexPage, Heading, HeroIcons, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { TextBackButton, activityTitleMap } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import { CardWithAttributes } from '../share/components/RequestedAttributesSection'
import { useActivities } from './activityRecord'

const { useParams } = createParam<{ id: string }>()

export function FunkeActivityDetailScreen() {
  const { params } = useParams()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const { activities } = useActivities()
  const { credentials } = useCredentialsForDisplay()
  const activity = activities.find((activity) => activity.id === params.id)

  if (!activity || activity.type === 'received') {
    // Received activity should route to credential detail (until support for multiple credentials in one request)
    router.back()
    return
  }

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage p={0} gap={0}>
      <YStack bbw="$0.5" p="$4" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack jc="center" ai="center" p="$4">
          <HeroIcons.ShieldCheckFilled strokeWidth={2} color="$positive-500" size={56} />
        </YStack>
        <YStack gap="$4" px="$4" marginBottom={bottom}>
          <Stack gap="$2" ai="center">
            <Heading textAlign="center" variant="h1">
              {activityTitleMap[activity.type]}
            </Heading>
            <Paragraph textAlign="center" color="$grey-700">
              You have shared this data with {activity.entityName ?? activity.entityHost} on{' '}
              {new Date(activity.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              .
            </Paragraph>
          </Stack>
          <Stack py="$4" gap="$4">
            {activity.credentials && activity.credentials.length > 0 ? (
              activity.credentials?.map((activityCredential) => {
                const credential = credentials.find((credential) => credential.id.includes(activityCredential.id))
                if (credential)
                  return (
                    <CardWithAttributes
                      key={credential.id}
                      id={credential.id}
                      name={credential.display.name}
                      backgroundColor={credential.display.backgroundColor}
                      backgroundImage={credential.display.backgroundImage}
                      disclosedAttributes={activityCredential.disclosedAttributes ?? []}
                      disclosedPayload={activityCredential.disclosedPayload ?? {}}
                    />
                  )
                return (
                  <CardWithAttributes
                    key={activityCredential.id}
                    id={activityCredential.id}
                    name="Unknown credential"
                    disclosedAttributes={activityCredential.disclosedAttributes ?? []}
                    disclosedPayload={activityCredential.disclosedPayload ?? {}}
                  />
                )
              })
            ) : (
              <Paragraph variant="annotation" ta="center">
                Disclosed information could not be shown.
              </Paragraph>
            )}
          </Stack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
