import { formatPredicate } from '@app/utils/formatePredicate'
import { useLingui } from '@lingui/react/macro'
import { CardWithAttributes } from '@package/app'
import { commonMessages } from '@package/translations'
import { Heading, Paragraph, YStack } from '@package/ui'
import {
  type CredentialRecord,
  type FormattedSubmission,
  type FormattedSubmissionEntryNotSatisfied,
  type FormattedSubmissionEntryPartialMatch,
  type FormattedSubmissionEntrySatisfied,
  type FormattedSubmissionEntrySatisfiedCredential,
  getClosestPartialMatch,
  getDisclosedAttributeNamesForDisplay,
  getRequestedAttributeNamesForDisplay,
} from '@paradym/wallet-sdk'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const { t } = useLingui()

  const satisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntrySatisfied => e.isSatisfied)
  const unsatisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntryNotSatisfied => !e.isSatisfied)
  // The user has a card of the requested type for these, it just lacks some requested attributes.
  const partiallySatisfiedEntries = unsatisfiedEntries.filter((e) => e.partialMatches.length > 0)
  const unavailableEntries = unsatisfiedEntries.filter((e) => e.partialMatches.length === 0)

  const requestedCardsHeading = t(commonMessages.requestedCardsHeading)
  const unavailableCardsHeading = t(commonMessages.unavailableCardsHeading)
  const fallbackCardLabel = t(commonMessages.credential)

  const formatDisclosedAttributes = (credential: FormattedSubmissionEntrySatisfiedCredential) =>
    getDisclosedAttributeNamesForDisplay(credential).map((c) => (typeof c === 'string' ? c : formatPredicate(c)))

  const formatAttributePaths = (
    paths: FormattedSubmissionEntryNotSatisfied['requestedAttributePaths'],
    record?: CredentialRecord
  ) => getRequestedAttributeNamesForDisplay(paths, record).map((c) => (typeof c === 'string' ? c : formatPredicate(c)))

  const firstHeading =
    satisfiedEntries.length > 0
      ? requestedCardsHeading
      : partiallySatisfiedEntries.length > 0
        ? t(commonMessages.missingAttributesHeading)
        : unavailableCardsHeading

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">{firstHeading}</Heading>
        <Paragraph>
          {t(
            unsatisfiedEntries.length === 0
              ? commonMessages.allRequestedCardsDescription
              : unavailableEntries.length === 0
                ? commonMessages.missingAttributesDescription
                : satisfiedEntries.length === 0 && partiallySatisfiedEntries.length === 0
                  ? commonMessages.noRequestedCardsDescription
                  : commonMessages.someRequestedCardsMissingDescription
          )}
        </Paragraph>
      </YStack>

      {/* We always take the first one for now (no selection) */}
      {satisfiedEntries.map(({ credentials: [credential], ...entry }) => {
        return (
          <CardWithAttributes
            key={entry.inputDescriptorId}
            id={credential.credential.id}
            name={credential.credential.display.name ?? t(commonMessages.unknown)}
            backgroundImage={credential.credential.display.backgroundImage}
            backgroundColor={credential.credential.display.backgroundColor}
            issuerImage={credential.credential.display.issuer.logo}
            textColor={credential.credential.display.textColor}
            formattedDisclosedAttributes={formatDisclosedAttributes(credential)}
            disclosedPayload={credential.disclosed.attributes}
            disclosedMetadata={credential.disclosed.metadata}
            isExpired={
              credential.credential.metadata?.validUntil
                ? new Date(credential.credential.metadata.validUntil) < new Date()
                : false
            }
            isNotYetActive={
              credential.credential.metadata?.validFrom
                ? new Date(credential.credential.metadata.validFrom) > new Date()
                : false
            }
          />
        )
      })}

      {partiallySatisfiedEntries.length > 0 && (
        <>
          {satisfiedEntries.length !== 0 && (
            <YStack>
              <Heading heading="sub2">{t(commonMessages.missingAttributesHeading)}</Heading>
            </YStack>
          )}
          {partiallySatisfiedEntries.map((entry) => {
            // Always defined, the entry has partial matches
            const { credential, missingAttributePaths } = getClosestPartialMatch(
              entry
            ) as FormattedSubmissionEntryPartialMatch
            const missingAttributes = formatAttributePaths(missingAttributePaths, credential.record)

            return (
              <CardWithAttributes
                key={entry.inputDescriptorId}
                name={credential.display.name ?? entry.name ?? fallbackCardLabel}
                backgroundImage={credential.display.backgroundImage}
                backgroundColor={credential.display.backgroundColor}
                issuerImage={credential.display.issuer.logo}
                textColor={credential.display.textColor}
                formattedDisclosedAttributes={Array.from(
                  new Set([
                    ...formatAttributePaths(entry.requestedAttributePaths, credential.record),
                    ...missingAttributes,
                  ])
                )}
                missingAttributes={missingAttributes}
              />
            )
          })}
        </>
      )}

      {unavailableEntries.length > 0 && (
        <>
          {(satisfiedEntries.length !== 0 || partiallySatisfiedEntries.length !== 0) && (
            <YStack>
              <Heading heading="sub2">{unavailableCardsHeading}</Heading>
            </YStack>
          )}
          {unavailableEntries.map((entry) => (
            <CardWithAttributes
              key={entry.inputDescriptorId}
              name={entry.name ?? fallbackCardLabel}
              // We only have the attribute paths, no way to know how to render
              // TODO: we could look at the vct?
              formattedDisclosedAttributes={formatAttributePaths(entry.requestedAttributePaths)}
              backgroundColor="$grey-800"
              textColor="$white"
            />
          ))}
        </>
      )}
    </YStack>
  )
}
