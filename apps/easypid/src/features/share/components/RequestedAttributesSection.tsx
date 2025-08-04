import { CardWithAttributes } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import {
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
} from '@paradym/wallet-sdk/display/common'
import type {
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
} from '@paradym/wallet-sdk/format/submission'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const satisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntrySatisfied => e.isSatisfied)
  const unsatisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntryNotSatisfied => !e.isSatisfied)

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading variant="sub2">{satisfiedEntries.length > 0 ? 'REQUESTED CARDS' : 'UNAVAILABLE CARDS'}</Heading>
        <Paragraph>
          {unsatisfiedEntries.length === 0
            ? 'The following cards will be shared.'
            : satisfiedEntries.length === 0
              ? `You don't have the requested card(s).`
              : `You don't have all of the requested cards.`}
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
              <Heading variant="sub2">UNAVAILABLE CARDS</Heading>
            </YStack>
          )}
          {unsatisfiedEntries.map((entry) => (
            <CardWithAttributes
              key={entry.inputDescriptorId}
              name={entry.name ?? 'Credential'}
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
