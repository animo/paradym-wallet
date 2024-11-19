import type { ClaimFormat } from '@credo-ts/core'
import {
  getPidAttributesForDisplay,
  getPidDisclosedAttributeNames,
  isPidCredential,
  usePidCredential,
} from '@easypid/hooks'
import type { FormattedSubmission } from '@package/agent/src'
import { Heading, Paragraph, YStack } from '@package/ui'
import { CardWithAttributes } from 'packages/app/src'

export type RequestedAttributesSectionProps = {
  submission: FormattedSubmission
}

export function RequestedAttributesSection({ submission }: RequestedAttributesSectionProps) {
  const { pidCredentialForDisplay } = usePidCredential()

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
                if (isPidCredential(credential.metadata?.type)) {
                  return (
                    <CardWithAttributes
                      key={pidCredentialForDisplay?.id}
                      id={pidCredentialForDisplay?.id as string}
                      name={pidCredentialForDisplay?.display.name as string}
                      issuerImage={pidCredentialForDisplay?.display.issuer.logo}
                      backgroundImage={pidCredentialForDisplay?.display.backgroundImage}
                      backgroundColor={pidCredentialForDisplay?.display.backgroundColor}
                      textColor={pidCredentialForDisplay?.display.textColor}
                      disclosedAttributes={getPidDisclosedAttributeNames(
                        credential?.disclosedPayload ?? {},
                        credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                      )}
                      disclosedPayload={getPidAttributesForDisplay(
                        credential?.disclosedPayload ?? {},
                        credential?.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                      )}
                      isExpired={
                        credential.metadata?.validUntil ? new Date(credential.metadata.validUntil) < new Date() : false
                      }
                      isNotYetActive={
                        credential.metadata?.validFrom ? new Date(credential.metadata.validFrom) > new Date() : false
                      }
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
                    isExpired={
                      credential.metadata?.validUntil ? new Date(credential.metadata.validUntil) < new Date() : false
                    }
                    isNotYetActive={
                      credential.metadata?.validFrom ? new Date(credential.metadata.validFrom) > new Date() : false
                    }
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
