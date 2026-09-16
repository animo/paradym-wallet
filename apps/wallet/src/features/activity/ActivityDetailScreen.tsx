import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { CardWithAttributes, getActivityInteraction, MiniDocument, TextBackButton } from '@package/app'
import { useHaptics, useScrollViewPosition } from '@package/app/hooks'
import { commonMessages } from '@package/translations'
import { Circle, FlexPage, Heading, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import type {
  CredentialForDisplay,
  FormattedAttributeObject,
  IssuanceActivity,
  PaymentActivity,
  PresentationActivity,
  PresentationActivityCredential,
  SignedActivity,
} from '@paradym/wallet-sdk'
import {
  formatAllAttributes,
  formatAttributesWithRecordMetadata,
  getAttributeLabelsForPaths,
  pickAttributesAtPaths,
  useActivityById,
  useCredentials,
} from '@paradym/wallet-sdk'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePaymentTransactionStatus } from '../../hooks/usePaymentTransactionStatus'
import { RequestPurposeSection } from '../share/components/RequestPurposeSection'
import { CredentialRowCard } from '../wallet/CredentialsScreen'
import { FailedReasonContainer } from './components/FailedReasonContainer'

/**
 * Names for the fields an activity recorded as disclosed.
 *
 * Resolved from the stored claim paths while the credential is still in the wallet, so the names
 * follow the language the user is reading in now. Once it has been deleted there is nothing to
 * resolve against, and the names fall back to the ones captured when it was shared — which stay in
 * whatever language was active then. Activities written before v3 only ever had those.
 */
function getDisclosedLabels(
  activityCredential: PresentationActivityCredential,
  credential?: CredentialForDisplay
): string[] {
  if (activityCredential.version !== 'v3' || !credential) return activityCredential.attributeNames

  return getAttributeLabelsForPaths(activityCredential.paths, { record: credential.record })
}

export function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const { t } = useLingui()

  const { activity, isLoading: isLoadingActivity } = useActivityById(id)
  usePaymentTransactionStatus(activity?.type === 'payment' ? activity : undefined)

  // Above the early returns below: reading an activity is a query now, so there is a render where
  // it is still loading — and a hook called only on the renders after it is a different hook count.
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  if (isLoadingActivity) return null

  if (!activity) {
    router.back()
    return
  }

  const Icon = getActivityInteraction(activity)
  const Title = t(Icon.text)

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
            {activity.type === 'shared' || activity.type === 'signed' || activity.type === 'payment' ? (
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
  noPurposeGiven: commonMessages.noPurposeProvided,
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
  const { credentials } = useCredentials()
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
          <Heading heading="sub2">{t(commonMessages.cards)}</Heading>

          <Paragraph>{description}</Paragraph>
        </YStack>
        {activity.credentialIds.map((credentialId) => {
          const credential = credentials.find((credential) => credential.id === credentialId)

          if (!credential) {
            return (
              <CredentialRowCard
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
            <CredentialRowCard
              key={credential.id}
              name={credential.display.name ?? t(commonMessages.unknown)}
              textColor={credential.display.textColor ?? '$grey-100'}
              backgroundColor={credential.display.backgroundColor ?? '$grey-900'}
              issuer={credential.display.issuer.name ?? t(commonMessages.unknown)}
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

export function SharedActivityDetailSection({
  activity,
}: {
  activity: PresentationActivity | SignedActivity | PaymentActivity
}) {
  const { credentials } = useCredentials()

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
      {activity && activity.type === 'signed' ? (
        <YStack gap="$4">
          <YStack gap="$2">
            <Heading heading="sub2">{t(commonMessages.documentHeading)}</Heading>
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
      ) : (
        activity.type === 'payment' && (
          <YStack gap="$4">
            <YStack gap="$2">
              <Heading heading="sub2">{t(commonMessages.paymentHeading)}</Heading>
            </YStack>
            <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
              <YStack f={1} gap="$2" ai="center">
                <Heading textTransform="none" color="$grey-800">
                  {activity.transaction.amount}
                </Heading>
                <Paragraph variant="sub" size="$2">
                  <Trans>To {activity.transaction.payee.name}</Trans>
                </Paragraph>
              </YStack>
            </XStack>
          </YStack>
        )
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
                      formattedDisclosedAttributes={getDisclosedLabels(activityCredential)}
                      // A v3 activity records which fields were disclosed, not what they held, and
                      // the credential they came from is gone — so the names are all there is.
                      disclosedPayload={
                        activityCredential.version === 'v3'
                          ? undefined
                          : activityCredential.version === 'v2' && activityCredential.id.startsWith('mdoc-')
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
                    name={credential.display.name ?? t(commonMessages.unknown)}
                    issuerImage={credential.display.issuer.logo}
                    textColor={credential.display.textColor}
                    backgroundColor={credential.display.backgroundColor}
                    backgroundImage={credential.display.backgroundImage}
                    formattedDisclosedAttributes={getDisclosedLabels(activityCredential, credential)}
                    disclosedPayload={formatAttributesWithRecordMetadata(
                      activityCredential.version === 'v3'
                        ? // The values come from the credential as it is now, which is the whole
                          // point of linking to it rather than copying it into the activity.
                          pickAttributesAtPaths(credential.rawAttributes, activityCredential.paths)
                        : activityCredential.attributes,
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
