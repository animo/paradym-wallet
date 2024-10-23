import { Circle, FlexPage, Heading, HeroIcons, MessageBox, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { TextBackButton, activityInteractions } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { formatRelativeDate } from 'packages/utils/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import { CardWithAttributes } from '../share/components/RequestedAttributesSection'
import { useActivities } from './activityRecord'
import { FailedReasonContainer } from './components/FailedReasonContainer'

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

  const Icon = activityInteractions[activity.type][activity.status]
  const Title = activityInteractions[activity.type][activity.status].text

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage p={0} gap={0}>
      <YStack bbw="$0.5" p="$4" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" marginBottom={bottom}>
          <Stack h="$8" jc="center" ai="center" pos="relative">
            <Circle pos="absolute" size="$7" bg={Icon.color} opacity={0.1} />
            <Circle pos="absolute" size="$5" bg={Icon.color} opacity={0.3} />
            <Circle size="$3" bg={Icon.color}>
              <Icon.icon strokeWidth={2} color="$white" />
            </Circle>
          </Stack>
          <YStack gap="$4" px="$4">
            <Stack gap="$2" ai="center">
              <Heading textAlign="center" variant="h1">
                {Title}
              </Heading>
              <Paragraph textAlign="center">{formatRelativeDate(new Date(activity.date), undefined, true)}</Paragraph>
            </Stack>
            <Stack gap="$4">
              <Stack h="$0.5" bg="$grey-50" mx="$-4" />
              <Stack gap="$2">
                <Heading variant="sub1" fontWeight="$semiBold">
                  Verifier's Intent
                </Heading>

                <MessageBox
                  variant="light"
                  message={activity.request.purpose ?? ''}
                  icon={<HeroIcons.ChatBubbleBottomCenterTextFilled color="$grey-700" />}
                />
              </Stack>
              <Stack gap="$4">
                <Stack gap="$2">
                  <Heading variant="sub1" fontWeight="$semiBold">
                    {activity.status === 'success' ? 'Shared attributes' : 'Requested information'}
                  </Heading>
                  <Paragraph>
                    {activity.status === 'success'
                      ? `These ${activity.request.credentials.length} credentials were shared.`
                      : 'No attributes were shared.'}
                  </Paragraph>
                </Stack>

                {activity.request.credentials && activity.request.credentials.length > 0 ? (
                  activity.request.credentials.map((activityCredential) => {
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
                          disableNavigation={activity.status !== 'success'}
                        />
                      )
                    return (
                      <CardWithAttributes
                        key={activityCredential.id}
                        id={activityCredential.id}
                        name="Deleted credential"
                        disclosedAttributes={activityCredential.disclosedAttributes ?? []}
                        disclosedPayload={activityCredential.disclosedPayload ?? {}}
                        disableNavigation={activity.status !== 'success'}
                      />
                    )
                  })
                ) : (
                  <FailedReasonContainer reason={activity.request.failureReason ?? 'unknown'} />
                )}
              </Stack>
            </Stack>
          </YStack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}
