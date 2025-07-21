import {
  type FormattedSubmission,
  type FormattedSubmissionEntryNotSatisfied,
  type FormattedSubmissionEntrySatisfied,
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
} from '@package/agent'
import { CardWithAttributes } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useLingui } from '@lingui/react/macro'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const { t } = useLingui()

  const satisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntrySatisfied => e.isSatisfied)
  const unsatisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntryNotSatisfied => !e.isSatisfied)

  const requestedCardsHeading = t({
    id: 'requestedAttributes.requestedCardsHeading',
    message: 'REQUESTED CARDS',
    comment: 'Heading shown above a list of requested cards the user has',
  })

  const unavailableCardsHeading = t({
    id: 'requestedAttributes.unavailableCardsHeading',
    message: 'UNAVAILABLE CARDS',
    comment: 'Heading shown above a list of requested cards the user does not have',
  })

  const onlySatisfiedDescription = t({
    id: 'requestedAttributes.onlySatisfiedDescription',
    message: 'The following cards will be shared.',
    comment: 'Description when the user has all requested cards',
  })

  const onlyUnsatisfiedDescription = t({
    id: 'requestedAttributes.onlyUnsatisfiedDescription',
    message: `You don't have the requested card(s).`,
    comment: 'Description when the user has none of the requested cards',
  })

  const partialDescription = t({
    id: 'requestedAttributes.partialDescription',
    message: `You don't have all of the requested cards.`,
    comment: 'Description when the user has some but not all requested cards',
  })

  const fallbackCardLabel = t({
    id: 'requestedAttributes.fallbackCardLabel',
    message: 'Credential',
    comment: 'Fallback name shown when a credential does not have a display name',
  })

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading variant="sub2">
          {satisfiedEntries.length > 0 ? requestedCardsHeading : unavailableCardsHeading}
        </Heading>
        <Paragraph>
          {unsatisfiedEntries.length === 0
            ? onlySatisfiedDescription
            : satisfiedEntries.length === 0
              ? onlyUnsatisfiedDescription
              : partialDescription}
        </Paragraph>
      </YStack>

      {/* We always take the first one for now (no selection) */}
      {satisfiedEntries.map(({ credentials: [credential], ...entry }) => {
        return (
          <CardWithAttributes
            key={entry.inputDescriptorId}
            id={credential.credential.id}
            name={credential.credential.display.name}
            backgroundImage={credential.credential.display.backgroundImage}
            backgroundColor={credential.credential.display.backgroundColor}
            issuerImage={credential.credential.display.issuer.logo}
            textColor={credential.credential.display.textColor}
            formattedDisclosedAttributes={getDisclosedAttributeNamesForDisplay(credential)}
            disclosedPayload={credential.disclosed.attributes}
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

      {unsatisfiedEntries.length > 0 && (
        <>
          {satisfiedEntries.length !== 0 && (
            <YStack>
              <Heading variant="sub2">{unavailableCardsHeading}</Heading>
            </YStack>
          )}
          {unsatisfiedEntries.map((entry) => (
            <CardWithAttributes
              key={entry.inputDescriptorId}
              name={entry.name ?? fallbackCardLabel}
              // We only have the attribute paths, no way to know how to render
              // TODO: we could look at the vct?
              // TODO: we should maybe support partial matches (i.e. vct matches), as then we can
              // show a much better UI (you have the cred, but age is not valid, or this param is missing)
              formattedDisclosedAttributes={getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths)}
              backgroundColor="$grey-800"
              textColor="$white"
            />
          ))}
        </>
      )}
    </YStack>
  )
}
