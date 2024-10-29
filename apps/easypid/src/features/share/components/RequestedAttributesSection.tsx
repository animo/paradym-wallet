import type { ClaimFormat } from '@credo-ts/core'
import { getPidAttributesForDisplay, getPidDisclosedAttributeNames, usePidCredential } from '@easypid/hooks'
import type { CredentialMetadata, FormattedSubmission } from '@package/agent/src'
import { Heading, Paragraph, YStack } from '@package/ui'
import { CardWithAttributes } from 'packages/app/src'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const { credential: pidCredential } = usePidCredential()

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading variant="sub2">REQUESTED ATTRIBUTES</Heading>
        <YStack gap="$4">
          <Paragraph>
            {submission.areAllSatisfied
              ? 'Only the following attributes will be shared. Nothing more.'
              : `You don't have the requested credential(s).`}
          </Paragraph>
          {submission.entries.map((entry) => (
            <YStack gap="$4" key={entry.inputDescriptorId}>
              {entry.credentials.map((credential) => {
                if (credential.metadata?.type === pidCredential?.type) {
                  const disclosedAttributes = getPidDisclosedAttributeNames(
                    credential?.disclosedPayload ?? {},
                    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                  )

                  const disclosedPayload = getPidAttributesForDisplay(
                    credential?.disclosedPayload ?? {},
                    credential?.metadata ?? ({} as CredentialMetadata),
                    credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                  )

                  return (
                    <CardWithAttributes
                      key={credential.id as string}
                      id={credential.id as string}
                      name={pidCredential?.display.name as string}
                      issuerImage={pidCredential?.display.issuer.logo}
                      backgroundImage={pidCredential?.display.backgroundImage}
                      backgroundColor={pidCredential?.display.backgroundColor}
                      textColor={pidCredential?.display.textColor}
                      disclosedAttributes={disclosedAttributes}
                      disclosedPayload={disclosedPayload}
                    />
                  )
                }
                return (
                  <CardWithAttributes
                    key={credential.id}
                    id={credential.id}
                    name={credential.credentialName}
                    backgroundImage={credential.backgroundImage}
                    backgroundColor={credential.backgroundColor}
                    issuerImage={credential.issuerImage}
                    textColor={credential.textColor}
                    disclosedAttributes={credential.requestedAttributes ?? []}
                    disclosedPayload={credential?.disclosedPayload ?? {}}
                  />
                )
              })}
            </YStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}
