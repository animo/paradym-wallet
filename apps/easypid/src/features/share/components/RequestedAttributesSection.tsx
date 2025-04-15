import {
  type FormattedSubmission,
  type FormattedSubmissionEntryNotSatisfied,
  type FormattedSubmissionEntrySatisfied,
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
  useCredentialsForDisplay,
} from '@package/agent'
import { CardWithAttributes } from '@package/app'
import { Heading, Paragraph, YStack } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

const copy = {
  satisfied: {
    title: 'REQUESTED CARDS',
    description: 'The following cards will be shared.',
  },
  unsatisfied: {
    title: 'UNAVAILABLE CARDS',
    description: "You don't have the requested card(s).",
  },
  unsatisfiedAll: {
    title: 'UNAVAILABLE CARDS',
    description: "You don't have all of the requested cards.",
  },
  invalid: {
    title: 'UNAVAILABLE ATTRIBUTES',
    description: 'The verifier requested attributes that are not present in your card(s).',
  },
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const satisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntrySatisfied => e.isSatisfied)
  const unsatisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntryNotSatisfied => !e.isSatisfied)
  const { credentials } = useCredentialsForDisplay()
  const [state, setState] = useState<'satisfied' | 'unsatisfied' | 'invalid'>(
    satisfiedEntries.length === 0 ? 'satisfied' : 'unsatisfied'
  )

  // We probably want to have invalid submissions be filled with the attributes that are available.
  // Alongside the ones that are not available.

  useEffect(() => {
    const hasInvalidCredential = unsatisfiedEntries.some((entry) =>
      credentials.find((c) => c.metadata.type === `https://${entry.name}`)
    )

    if (hasInvalidCredential) setState('invalid')
  }, [credentials, unsatisfiedEntries])

  const formatUnsatisfiedEntries = useMemo(() => {
    return unsatisfiedEntries.map((entry) => {
      const credential = credentials.find((c) => c.metadata.type === `https://${entry.name}`)
      return {
        ...entry,
        credential,
      }
    })
  }, [credentials, unsatisfiedEntries])

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading variant="sub2">{copy[state].title}</Heading>
        <Paragraph>{copy[state].description}</Paragraph>
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
      {formatUnsatisfiedEntries.length > 0 && (
        <>
          {formatUnsatisfiedEntries.map(({ credential, ...entry }) => {
            const availableAttributes = Object.keys(credential?.attributes ?? {})
            const requestedAttributes = getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths)
            const missingAttributes = requestedAttributes.filter((attr) => !availableAttributes.includes(attr))

            return (
              <CardWithAttributes
                key={entry.inputDescriptorId}
                id={credential?.id}
                name={credential?.display.name ?? entry.name ?? 'Credential'}
                formattedDisclosedAttributes={getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths)}
                missingAttributes={missingAttributes}
                backgroundImage={credential?.display.backgroundImage}
                backgroundColor={credential?.display.backgroundColor ?? '$grey-800'}
                textColor={credential?.display.textColor ?? '$white'}
                issuerImage={credential?.display.issuer.logo}
              />
            )
          })}
        </>
      )}
    </YStack>
  )
}
