import { ClaimFormat, type DifPexCredentialsForRequest } from '@credo-ts/core'

import { type CredentialMetadata, filterAndMapSdJwtKeys, getCredentialForDisplay } from '../display'

export interface FormattedSubmission {
  name: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

export interface FormattedSubmissionEntry {
  /** can be either AnonCreds groupName or PEX inputDescriptorId */
  inputDescriptorId: string
  isSatisfied: boolean

  name: string
  description?: string

  credentials: Array<{
    id: string
    credentialName: string
    issuerName?: string
    requestedAttributes?: string[]
    disclosedPayload?: Record<string, unknown>
    metadata: CredentialMetadata
    backgroundColor?: string
  }>
}

export function formatDifPexCredentialsForRequest(
  credentialsForRequest: DifPexCredentialsForRequest
): FormattedSubmission {
  const entries = credentialsForRequest.requirements.flatMap((requirement) => {
    return requirement.submissionEntry.map((submission): FormattedSubmissionEntry => {
      return {
        inputDescriptorId: submission.inputDescriptorId,
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: submission.verifiableCredentials.length >= 1,

        credentials: submission.verifiableCredentials.map((verifiableCredential) => {
          const { display, attributes, metadata } = getCredentialForDisplay(verifiableCredential.credentialRecord)

          let disclosedPayload = attributes
          if (verifiableCredential.type === ClaimFormat.SdJwtVc) {
            disclosedPayload = filterAndMapSdJwtKeys(verifiableCredential.disclosedPayload).visibleProperties
          }

          return {
            id: verifiableCredential.credentialRecord.id,
            credentialName: display.name,
            issuerName: display.issuer.name,
            requestedAttributes: [...Object.keys(attributes), ...Object.keys(metadata)],
            disclosedPayload,
            metadata,
            backgroundColor: display.backgroundColor,
          }
        }),
      }
    })
  })

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    name: credentialsForRequest.name ?? 'Unknown',
    purpose: credentialsForRequest.purpose,
    entries,
  }
}
