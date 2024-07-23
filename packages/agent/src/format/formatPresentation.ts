import type { DifPexCredentialsForRequest } from '@credo-ts/core'

import { ClaimFormat } from '@credo-ts/core'

import { filterAndMapSdJwtKeys, getCredentialForDisplay } from '../display'

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
          const { display, credential } = getCredentialForDisplay(verifiableCredential.credentialRecord)

          // TODO: support nesting
          let requestedAttributes: string[]
          if (verifiableCredential.type === ClaimFormat.SdJwtVc) {
            const { metadata, visibleProperties } = filterAndMapSdJwtKeys(verifiableCredential.disclosedPayload)
            requestedAttributes = [...Object.keys(visibleProperties), ...Object.keys(metadata)]
          } else {
            requestedAttributes = Object.keys(credential?.credentialSubject ?? {})
          }

          return {
            id: verifiableCredential.credentialRecord.id,
            credentialName: display.name,
            issuerName: display.issuer.name,
            requestedAttributes,
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
