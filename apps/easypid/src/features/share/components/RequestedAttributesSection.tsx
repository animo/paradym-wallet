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
              {entry.isSatisfied ? (
                entry.credentials.map((credential) => {
                  const isPid = isPidCredential(credential.credential.metadata?.type)
                  // FIXME: this renders sd-jwt even if mdoc is requested
                  // FIXME: pid credential display metadata and disclosed attributes
                  //  should happen on a higher level
                  const credentialForDisplay =
                    isPid && pidCredentialForDisplay ? pidCredentialForDisplay : credential.credential
                  const disclosedPayload = isPid
                    ? getPidAttributesForDisplay(
                        credential?.disclosedPayload ?? {},
                        credential?.credential.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                      )
                    : credential?.disclosedPayload
                  const disclosedAttributes = isPid
                    ? getPidDisclosedAttributeNames(
                        credential?.disclosedPayload ?? {},
                        credential?.credential.claimFormat as ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
                      )
                    : credential.requestedAttributes

                  return (
                    <CardWithAttributes
                      key={entry.inputDescriptorId}
                      id={credentialForDisplay.id}
                      name={credentialForDisplay.display.name}
                      backgroundImage={credentialForDisplay.display.backgroundImage}
                      backgroundColor={credentialForDisplay.display.backgroundColor}
                      issuerImage={credentialForDisplay.display.issuer.logo}
                      textColor={credentialForDisplay.display.textColor}
                      disclosedAttributes={disclosedAttributes ?? []}
                      disclosedPayload={disclosedPayload ?? {}}
                      isExpired={
                        credentialForDisplay.metadata?.validUntil
                          ? new Date(credentialForDisplay.metadata.validUntil) < new Date()
                          : false
                      }
                      isNotYetActive={
                        credentialForDisplay.metadata?.validFrom
                          ? new Date(credentialForDisplay.metadata.validFrom) > new Date()
                          : false
                      }
                    />
                  )
                })
              ) : (
                // FIXME: if not present we should still show the pid requested attributes
                // But mapping should happen on higher layer
                <CardWithAttributes
                  key={entry.inputDescriptorId}
                  // Navigation is disabled
                  id={entry.inputDescriptorId}
                  name={entry.name}
                  disableNavigation
                  disclosedAttributes={entry.requestedAttributes}
                />
              )}
            </YStack>
          ))}
        </YStack>
      </YStack>
    </YStack>
  )
}
