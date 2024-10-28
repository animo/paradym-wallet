import {
  Circle,
  FlexPage,
  Heading,
  HeroIcons,
  Image,
  MessageBox,
  Paragraph,
  ScrollView,
  Stack,
  XStack,
  YStack,
} from '@package/ui'
import React from 'react'
import { createParam } from 'solito'

import { useCredentialsWithCustomDisplay } from '@easypid/hooks/useCredentialsWithCustomDisplay'
import { CardWithAttributes, TextBackButton, activityInteractions } from '@package/app'
import { useScrollViewPosition } from '@package/app/src/hooks'
import { formatRelativeDate } from 'packages/utils/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import { useActivities } from './activityRecord'
import { FailedReasonContainer } from './components/FailedReasonContainer'

const { useParams } = createParam<{ id: string }>()

export function FunkeActivityDetailScreen() {
  const { params } = useParams()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()

  const { activities } = useActivities()
  const { credentials } = useCredentialsWithCustomDisplay()
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
            <Stack h={1} my="$2" bg="$grey-100" />
            <Stack gap="$6">
              <Stack gap="$3">
                <Heading variant="sub2">Purpose</Heading>
                <YStack gap="$2">
                  <XStack gap="$2" bg="$grey-50" px="$4" py="$3" borderRadius="$8">
                    <Paragraph f={1}>
                      {activity.request.purpose ?? 'No information was provided on the purpose of the data request.'}
                    </Paragraph>

                    <Circle size="$4">
                      {activity.entity.logo?.url ? (
                        <Image
                          circle
                          src={activity.entity.logo.url}
                          alt={activity.entity.name}
                          width="100%"
                          height="100%"
                          resizeMode="cover"
                        />
                      ) : (
                        <HeroIcons.BuildingOffice color="$grey-800" size={36} />
                      )}
                    </Circle>
                  </XStack>
                </YStack>
              </Stack>
              <Stack gap="$3">
                <Stack gap="$2">
                  <Heading variant="sub2">
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
                          issuerImage={credential.display.issuer.logo}
                          textColor={credential.display.textColor}
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
