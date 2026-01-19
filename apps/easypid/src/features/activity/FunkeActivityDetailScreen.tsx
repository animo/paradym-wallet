import { TransactionList } from '@easypid/features/share/components/TransactionSummaryCards'
import { getAllTransactionCredentialIds } from '@easypid/utils/transactionUtils'
import { defineMessage, plural } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type IssuanceActivity,
  type PresentationActivity,
  type SignedActivity,
  useActivities,
  useCredentialsForDisplay,
} from '@package/agent'
import { CardWithAttributes, getActivityInteraction, TextBackButton } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { Circle, FlexPage, Heading, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RequestPurposeSection } from '../share/components/RequestPurposeSection'
import { FunkeCredentialRowCard } from '../wallet/FunkeCredentialsScreen'
import { FailedReasonContainer } from './components/FailedReasonContainer'

export function FunkeActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { t } = useLingui()

  const { activities } = useActivities()
  const activity = activities.find((activity) => activity.id === id)
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  useEffect(() => {
    if (!activity) {
      router.back()
    }
  }, [activity, router])

  if (!activity) {
    return null
  }

  const interaction = getActivityInteraction(activity)
  const Title = t(interaction.text)

  return (
    <FlexPage p={0} gap={0}>
      <YStack bbw="$0.5" h="$4" borderColor={isScrolledByOffset ? '$grey-200' : '$background'} />
      <ScrollView onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
        <YStack gap="$4" marginBottom={bottom}>
          <Stack h="$8" jc="center" ai="center" pos="relative">
            <Circle pos="absolute" size={72} bg={interaction.color} opacity={0.1} />
            <Circle pos="absolute" size={58} bg={interaction.color} opacity={0.2} />
            <Stack flexDirection="row">
              {interaction.icon.map((Icon, index) => (
                <Icon strokeWidth={2} color="$white" key={index} />
              ))}
            </Stack>
          </Stack>
          <YStack gap="$4" px="$4">
            <Stack gap="$2" ai="center">
              <Heading textAlign="center" heading="h1">
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

const activityMessages = {
  deletedCredential: defineMessage({
    id: 'activity.deletedCredential',
    message: 'Deleted credential',
    comment: 'Shown when a credential no longer exists in the wallet',
  }),
  noPurposeGiven: defineMessage({
    id: 'activity.noPurposeGiven',
    message: 'No information was provided on the purpose of the data request. Be cautious',
    comment:
      'Shown as a warning to the user when the verifier did not provide a purpose for the request. The user can still continue to accept if they wish.',
  }),
  sharedAttributes: defineMessage({
    id: 'activity.sharedAttributesHeading',
    message: 'Shared attributes',
    comment: 'Heading shown when attributes were successfully shared in an activity',
  }),
  requestedInformation: defineMessage({
    id: 'activity.requestedInformationHeading',
    message: 'Requested information',
    comment: 'Heading shown when the request did not result in attributes being shared',
  }),
}

export function ReceivedActivityDetailSection({ activity }: { activity: IssuanceActivity }) {
  const { credentials } = useCredentialsForDisplay()
  const { withHaptics } = useHaptics()
  const { push } = useRouter()
  const pushToCredential = withHaptics((id: string) => push(`/credentials/${id}`))
  const { t } = useLingui()

  let description: string
  switch (activity.status) {
    case 'failed':
      description = t({
        id: 'activity.receivedFailed',
        message: `Receiving the cards from ${activity.entity.name} failed.`,
        comment: 'Shown in activity detail when receiving credentials failed',
      })
      break
    case 'stopped':
      description = t({
        id: 'activity.receivedStopped',
        message: `Receiving the cards from ${activity.entity.name} was cancelled.`,
        comment: 'Shown in activity detail when receiving credentials was cancelled by the user',
      })
      break
    case 'pending':
      description = t({
        id: 'activity.receivedPending',
        message: `The cards from ${activity.entity.name} is are not ready yet and will be fetched at a later date.`,
        comment: 'Shown in activity detail when the received credentials are pending',
      })
      break
    default:
      description = t({
        id: 'activity.receivedMultiple',
        comment: 'Shown in activity detail when credentials have been received',
        message: plural(activity.credentialIds.length, {
          one: `You have received the following card from ${activity.entity.name}.`,
          other: `You have received the following cards from ${activity.entity.name}.`,
        }),
      })
      break
  }

  return (
    <Stack gap="$6">
      <YStack gap="$4">
        <YStack gap="$2">
          <Heading heading="sub2">
            <Trans
              id="activity.cardsHeading"
              comment="Section heading for list of received cards in the activity detail screen"
            >
              Cards
            </Trans>
          </Heading>

          <Paragraph>{description}</Paragraph>
        </YStack>
        {activity.credentialIds.map((credentialId) => {
          const credential = credentials.find((credential) => credential.id === credentialId)

          if (!credential) {
            return (
              <FunkeCredentialRowCard
                key={credentialId}
                name={t(activityMessages.deletedCredential)}
                textColor="$grey-100"
                backgroundColor="$grey-900"
                issuer={activity.entity.name ?? t(commonMessages.unknown)}
                issuedAt={activity.date ? new Date(activity.date) : undefined}
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
  const { t } = useLingui()

  const formattedTransactionData =
    activity.type === 'signed' && activity.transactions ? activity.transactions : undefined

  const activityCredentials = activity.request.credentials ?? []

  // Identify credentials used in transactions
  const transactionCredentialIds = getAllTransactionCredentialIds(formattedTransactionData)

  const transactionCredentials = activityCredentials.filter(
    (c) => 'id' in c && transactionCredentialIds.has(c.id as string)
  )

  // Deduplicate transaction credentials
  const uniqueTransactionCredentials = transactionCredentials.filter(
    (c, index, self) => index === self.findIndex((t) => 'id' in t && 'id' in c && t.id === c.id)
  )

  const otherCredentials = activityCredentials.filter(
    (c) => !('id' in c) || !transactionCredentialIds.has(c.id as string)
  )

  const amountShared = activityCredentials.length
  const description =
    activity.status === 'success'
      ? t({
          id: 'activity.sharedSummary',
          comment: 'Shown when credentials were successfully shared',
          message: plural(amountShared, {
            one: '1 credential was shared.',
            other: '# credentials were shared.',
          }),
        })
      : t({
          id: 'activity.sharedSummaryNone',
          message: 'No credentials were shared.',
          comment: 'Shown when sharing failed and no credentials were shared',
        })

  const renderCredentialCard = (activityCredential: (typeof activityCredentials)[number]) => {
    if (!('id' in activityCredential)) {
      // Not satisfied credential
      return (
        <CardWithAttributes
          key={activityCredential.name} // Fallback key
          name={activityCredential.name ?? t(activityMessages.deletedCredential)}
          textColor="$white"
          backgroundColor="$grey-800"
          formattedDisclosedAttributes={activityCredential.attributeNames}
        />
      )
    }

    const credential = credentials.find((credential) => credential.id === activityCredential.id)

    if (!credential) {
      return (
        <CardWithAttributes
          key={activityCredential.id}
          id={activityCredential.id}
          name={t(activityMessages.deletedCredential)}
          textColor="$grey-100"
          backgroundColor="$primary-500"
          formattedDisclosedAttributes={activityCredential.attributeNames}
          disclosedPayload={activityCredential.attributes}
        />
      )
    }

    const isExpired = credential.metadata.validUntil ? new Date(credential.metadata.validUntil) < new Date() : false

    const isNotYetActive = credential.metadata.validFrom ? new Date(credential.metadata.validFrom) > new Date() : false

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

  return (
    <Stack gap="$6">
      <RequestPurposeSection
        purpose={activity.request.purpose ?? t(activityMessages.noPurposeGiven)}
        logo={activity.entity.logo}
        overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
      />

      <TransactionList
        formattedTransactionData={formattedTransactionData}
        selectedTransactionData={activityCredentials
          .map((c) => ('id' in c ? { credentialId: c.id as string } : undefined))
          .filter((c): c is { credentialId: string } => c !== undefined)}
        status={activity.status}
      />

      {uniqueTransactionCredentials.length > 0 && (
        <YStack gap="$4">
          <YStack gap="$2">
            <Heading heading="sub2">
              <Trans id="activity.transactionCardsHeading">Transaction cards</Trans>
            </Heading>
            <Paragraph>
              <Trans id="activity.transactionCardsIntro">
                The following personal information was used for the transactions.
              </Trans>
            </Paragraph>
          </YStack>
          {uniqueTransactionCredentials.map(renderCredentialCard)}
        </YStack>
      )}

      {otherCredentials.length > 0 && (
        <Stack gap="$3">
          <Stack gap="$2">
            <Heading heading="sub2">
              {activity.status === 'success'
                ? t(activityMessages.sharedAttributes)
                : t(activityMessages.requestedInformation)}
            </Heading>
            <Paragraph>{description}</Paragraph>
          </Stack>
          {otherCredentials.map(renderCredentialCard)}
        </Stack>
      )}

      {activityCredentials.length === 0 && (
        <FailedReasonContainer reason={activity.request.failureReason ?? 'unknown'} />
      )}
    </Stack>
  )
}
