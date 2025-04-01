import { Circle, FlexPage, Heading, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { createParam } from 'solito'

import { useCredentialsForDisplay } from '@package/agent'
import { CardWithAttributes, MiniDocument, TextBackButton, activityInteractions } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/src/hooks'
import { formatRelativeDate } from 'packages/utils/src'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'
import { RequestPurposeSection } from '../share/components/RequestPurposeSection'
import { FunkeCredentialRowCard } from '../wallet/FunkeCredentialsScreen'
import { type IssuanceActivity, type PresentationActivity, type SignedActivity, useActivities } from './activityRecord'
import { FailedReasonContainer } from './components/FailedReasonContainer'

const { useParams } = createParam<{ id: string }>()

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

  const Icon = activityInteractions[activity.type][activity.status]
  const Title = activityInteractions[activity.type][activity.status].text

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <FlexPage p={0} gap={0}>
      <YStack bbw="$0.5" h="$4" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" marginBottom={bottom}>
          <Stack h="$8" jc="center" ai="center" pos="relative">
            <Circle pos="absolute" size={72} bg={Icon.color} opacity={0.1} />
            <Circle pos="absolute" size={58} bg={Icon.color} opacity={0.2} />
            <Circle size="$4" bg={Icon.color}>
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
            {activity.type === 'shared' || activity.type === 'signed' ? (
              <SharedActivityDetailSection activity={activity} />
            ) : (
              <ReceivedActivityDetailSection activity={activity} />
            )}
          </YStack>
        </YStack>
      </ScrollView>
      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
        <TextBackButton />
      </YStack>
    </FlexPage>
  )
}

export function ReceivedActivityDetailSection({ activity }: { activity: IssuanceActivity }) {
  const { credentials } = useCredentialsForDisplay()
  const { withHaptics } = useHaptics()
  const { push } = useRouter()
  const pushToCredential = withHaptics((id: string) => push(`/credentials/${id}`))

  return (
    <Stack gap="$6">
      <YStack gap="$4">
        <YStack gap="$2">
          <Heading variant="sub2">Cards</Heading>
          <Paragraph>
            The following{activity.credentialIds.length < 1 ? ` ${activity.credentialIds.length}` : ''} card
            {activity.credentialIds.length > 1 ? 's' : ''} {activity.credentialIds.length > 1 ? 'were' : 'was'}{' '}
            received.
          </Paragraph>
        </YStack>
        {activity.credentialIds.map((credentialId) => {
          const credential = credentials.find((credential) => credential.id === credentialId)

          if (!credential) {
            return (
              <CardWithAttributes
                id={credentialId}
                name="Deleted credential"
                textColor="$grey-100"
                backgroundColor="$primary-500"
                formattedDisclosedAttributes={[]}
              />
            )
          }

          return (
            <FunkeCredentialRowCard
              key={credential.id}
              name={credential.display.name}
              textColor={credential.display.textColor ?? '$grey-100'}
              backgroundColor={credential.display.backgroundColor ?? '$grey-900'}
              issuer={credential.display.issuer.name}
              logo={credential.display.issuer.logo}
              issuedAt={credential.metadata.issuedAt ? new Date(credential.metadata.issuedAt) : undefined}
              onPress={() => {
                pushToCredential(credential.id)
              }}
            />
          )
        })}
      </YStack>
    </Stack>
  )
}

export function SharedActivityDetailSection({ activity }: { activity: PresentationActivity | SignedActivity }) {
  const { credentials } = useCredentialsForDisplay()

  const amountShared = activity.request.credentials?.length ?? 0
  const sharedCredentialAmount = amountShared > 1 ? 's' : ''

  return (
    <Stack gap="$6">
      <RequestPurposeSection
        purpose={
          activity.request.purpose ?? 'No information was provided on the purpose of the data request. Be cautious'
        }
        logo={activity.entity.logo}
        overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
      />
      {activity && activity.type === 'signed' && (
        <YStack gap="$4">
          <YStack gap="$2">
            <Heading variant="sub2">Document</Heading>
            <Paragraph>
              {activity.status === 'success' ? 'The document was signed.' : 'The document was not signed.'}
            </Paragraph>
          </YStack>
          <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
            <YStack f={1} gap="$2">
              <Heading variant="sub2" textTransform="none" color="$grey-800">
                {activity.transaction?.documentName}
              </Heading>
              <Paragraph>Signing with {activity.transaction?.qtsp.name}</Paragraph>
            </YStack>
            <MiniDocument logoUrl={activity.transaction?.qtsp.logo?.url} />
          </XStack>
        </YStack>
      )}
      <Stack gap="$3">
        <Stack gap="$2">
          <Heading variant="sub2">
            {activity.status === 'success' ? 'Shared attributes' : 'Requested information'}
          </Heading>
          <Paragraph>
            {activity.status === 'success'
              ? `${amountShared} credential${sharedCredentialAmount} ${amountShared === 1 ? 'was' : 'were'} shared.`
              : 'No credentials were shared.'}
          </Paragraph>
        </Stack>

        {activity.request.credentials && activity.request.credentials.length > 0 ? (
          activity.request.credentials.map((activityCredential) => {
            if ('id' in activityCredential) {
              const credential = credentials.find((credential) => credential.id === activityCredential.id)

              if (!credential) {
                return (
                  <CardWithAttributes
                    id={activityCredential.id}
                    name="Deleted credential"
                    textColor="$grey-100"
                    backgroundColor="$primary-500"
                    formattedDisclosedAttributes={activityCredential.attributeNames}
                    disclosedPayload={activityCredential.attributes}
                  />
                )
              }

              const isExpired = credential.metadata.validUntil
                ? new Date(credential.metadata.validUntil) < new Date()
                : false

              const isNotYetActive = credential.metadata.validFrom
                ? new Date(credential.metadata.validFrom) > new Date()
                : false

              return (
                <CardWithAttributes
                  key={credential.id}
                  id={credential.id}
                  name={credential.display.name}
                  issuerImage={credential.display.issuer.logo}
                  textColor={credential.display.textColor}
                  backgroundColor={credential.display.backgroundColor}
                  backgroundImage={credential.display.backgroundImage}
                  formattedDisclosedAttributes={activityCredential.attributeNames}
                  disclosedPayload={activityCredential.attributes}
                  isExpired={isExpired}
                  isNotYetActive={isNotYetActive}
                />
              )
            }
          })
        ) : (
          <FailedReasonContainer reason={activity.request.failureReason ?? 'unknown'} />
        )}
      </Stack>
    </Stack>
  )
}
