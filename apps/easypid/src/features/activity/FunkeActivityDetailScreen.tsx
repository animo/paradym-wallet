import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type FormattedAttributeObject,
  formatAllAttributes,
  formatAttributesWithRecordMetadata,
  type IssuanceActivity,
  type PresentationActivity,
  type SignedActivity,
  useActivities,
  useCredentialsForDisplay,
} from '@package/agent'
import { CardWithAttributes, getActivityInteraction, MiniDocument, TextBackButton } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { Circle, FlexPage, Heading, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { useLocalSearchParams, useRouter } from 'expo-router'
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

  if (!activity) {
    router.back()
    return
  }

  const Icon = getActivityInteraction(activity)
  const Title = t(Icon.text)

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
  documentSigned: defineMessage({
    id: 'activity.documentSigned',
    message: 'The document was signed.',
    comment: 'Shown after a successful digital signature',
  }),
  documentNotSigned: defineMessage({
    id: 'activity.documentNotSigned',
    message: 'The document was not signed.',
    comment: 'Shown after a failed digital signature',
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
      if (activity.credentialIds.length > 1) {
        description = t({
          id: 'activity.receivedMultiple',
          message: `You have received the following cards from ${activity.entity.name}.`,
          comment: 'Shown in activity detail when multiple credentials have been received',
        })
      } else {
        description = t({
          id: 'activity.receivedSingle',
          message: `You have received the following card from ${activity.entity.name}.`,
          comment: 'Shown in activity detail when one credential has been received',
        })
      }
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

  const amountShared = activity.request.credentials?.length ?? 0
  const { t } = useLingui()

  const description =
    activity.status === 'success'
      ? amountShared > 1
        ? t({
            id: 'activity.sharedSummaryPlural',
            message: `${amountShared} credentials were shared.`,
            comment: 'Shown when multiple credentials were successfully shared',
          })
        : t({
            id: 'activity.sharedSummarySingle',
            message: '1 credential was shared.',
            comment: 'Shown when one credential was successfully shared',
          })
      : t({
          id: 'activity.sharedSummaryNone',
          message: 'No credentials were shared.',
          comment: 'Shown when sharing failed and no credentials were shared',
        })

  return (
    <Stack gap="$6">
      <RequestPurposeSection
        purpose={activity.request.purpose ?? t(activityMessages.noPurposeGiven)}
        logo={activity.entity.logo}
        overAskingResponse={{ validRequest: 'could_not_determine', reason: '' }}
      />
      {activity && activity.type === 'signed' && (
        <YStack gap="$4">
          <YStack gap="$2">
            <Heading heading="sub2">
              <Trans
                id="activity.documentHeading"
                comment="Section heading shown when a document was signed or attempted to be signed"
              >
                Document
              </Trans>
            </Heading>
            <Paragraph>
              {activity.status === 'success'
                ? t(activityMessages.documentSigned)
                : t(activityMessages.documentNotSigned)}
            </Paragraph>
          </YStack>
          <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
            <YStack f={1} gap="$2">
              <Heading heading="sub2" textTransform="none" color="$grey-800">
                {activity.transaction?.documentName}
              </Heading>
              <Paragraph>
                <Trans
                  id="activity.signedWithQTSP"
                  comment="Shown below a document name to indicate the user signed it with a specific QTSP"
                >
                  Signing with {activity.transaction?.qtsp.name}
                </Trans>
              </Paragraph>
            </YStack>
            <MiniDocument logoUrl={activity.transaction?.qtsp.logo?.url} />
          </XStack>
        </YStack>
      )}
      <Stack gap="$3">
        <Stack gap="$2">
          <Heading heading="sub2">
            {activity.status === 'success'
              ? t(activityMessages.sharedAttributes)
              : t(activityMessages.requestedInformation)}
          </Heading>
          <Paragraph>{description}</Paragraph>
        </Stack>

        {activity.request.credentials && activity.request.credentials.length > 0 ? (
          activity.request.credentials
            .map((activityCredential) => {
              if ('id' in activityCredential) {
                const credential = credentials.find((credential) => credential.id === activityCredential.id)

                // Credential has been deleted
                if (!credential) {
                  return (
                    <CardWithAttributes
                      name={activityCredential.name ?? t(activityMessages.deletedCredential)}
                      textColor="$grey-100"
                      backgroundColor="$primary-500"
                      formattedDisclosedAttributes={activityCredential.attributeNames}
                      disclosedPayload={
                        activityCredential.version === 'v2' && activityCredential.id.startsWith('mdoc-')
                          ? formatAllAttributes(activityCredential.attributes).flatMap(
                              (item) => (item as FormattedAttributeObject).value
                            )
                          : formatAllAttributes(activityCredential.attributes)
                      }
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
                    // FIXME should store the paths as well, so we can dynamically resolve
                    // the claim labels
                    formattedDisclosedAttributes={activityCredential.attributeNames}
                    disclosedPayload={formatAttributesWithRecordMetadata(
                      activityCredential.attributes,
                      credential.record
                    )}
                    isExpired={isExpired}
                    isNotYetActive={isNotYetActive}
                  />
                )
              }

              return undefined
            })
            .filter((v) => v !== undefined)
        ) : (
          <FailedReasonContainer reason={activity.request.failureReason ?? 'unknown'} />
        )}
      </Stack>
    </Stack>
  )
}
