import {
  type FormattedSubmission,
  type FormattedSubmissionEntryNotSatisfied,
  type FormattedSubmissionEntrySatisfied,
  getDisclosedAttributeNamesForDisplay,
  getUnsatisfiedAttributePathsForDisplay,
  useCredentialsForDisplay,
} from '@package/agent'
import { CardWithAttributes } from '@package/app'
import { Heading, HeroIcons, Paragraph, XStack, YStack } from '@package/ui'
import { useEffect, useMemo, useState } from 'react'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

const copy = {
  satisfied: {
    title: 'REQUESTED CARDS',
    description: 'The following cards will be shared.',
    variant: 'default',
  },
  unsatisfied: {
    title: 'CARDS UNAVAILABLE',
    description: "You don't have the requested card(s).",
    variant: '$danger-500',
  },
  invalid: {
    title: 'ATTRIBUTES UNAVAILABLE',
    description: 'The verifier requested attributes that are not present in your card(s).',
    variant: '$danger-500',
  },
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const satisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntrySatisfied => e.isSatisfied)
  const unsatisfiedEntries = submission.entries.filter((e): e is FormattedSubmissionEntryNotSatisfied => !e.isSatisfied)
  const { credentials } = useCredentialsForDisplay()
  const [state, setState] = useState<'satisfied' | 'unsatisfied' | 'invalid'>(
    satisfiedEntries.length === 0 ? 'satisfied' : 'unsatisfied'
  )

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
        <XStack gap="$2">
          {state !== 'satisfied' && <HeroIcons.ExclamationCircleFilled size={20} color={copy[state].variant} />}
          <Heading variant="sub2" color={copy[state].variant}>
            {copy[state].title}
          </Heading>
        </XStack>
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
            const attributeValuesThatCouldBeDisclosed = requestedAttributes.filter((attr) =>
              availableAttributes.includes(attr)
            )

            // Attributes with their values that could be found in the credential
            const attributesWithValuesThatCouldBeDisclosed = attributeValuesThatCouldBeDisclosed.reduce<
              Record<string, unknown>
            >(
              (acc, attr) => ({
                ...acc,
                [attr]: credential?.attributes[attr],
              }),
              {}
            )

            // Add missing attributes to the disclosed payload without values
            const disclosedPayloadWithMissingAttributes = {
              ...attributesWithValuesThatCouldBeDisclosed,
              ...Object.fromEntries(missingAttributes.map((attr) => [attr, 'value-not-found'])),
            }

            return (
              <CardWithAttributes
                key={entry.inputDescriptorId}
                id={credential?.id}
                name={credential?.display.name ?? entry.name ?? 'Credential'}
                formattedDisclosedAttributes={getUnsatisfiedAttributePathsForDisplay(entry.requestedAttributePaths)}
                backgroundImage={credential?.display.backgroundImage}
                backgroundColor={credential?.display.backgroundColor ?? '$grey-800'}
                disclosedPayload={disclosedPayloadWithMissingAttributes}
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
