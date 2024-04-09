import type { DifPexCredentialsForRequest } from '@credo-ts/core'

import { getCredentialForDisplay } from '../display'

export interface FormattedSubmission {
  name: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

export interface FormattedSubmissionEntry {
  inputDescriptorId: string
  name: string
  description?: string
  isSatisfied: boolean

  credentials: Array<{
    credentialName: string
    issuerName: string
    requestedAttributes: string[]
    backgroundColor?: string
  }>
}

export function formatDifPexCredentialsForRequest(
  credentialsForRequest: DifPexCredentialsForRequest
): FormattedSubmission {
  const entries = credentialsForRequest.requirements.flatMap((requirement) => {
    return requirement.submissionEntry.map((submission) => {
      return {
        inputDescriptorId: submission.inputDescriptorId,
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: submission.verifiableCredentials.length >= 1,
        credentials: submission.verifiableCredentials.map((credentialRecord) => {
          const { display, credential, attributes } = getCredentialForDisplay(credentialRecord)

          return {
            credentialName: display.name,
            issuerName: display.issuer.name,
            // FIXME: will PEX already apply SD, and thus overwrite the original? That would be really problematic
            // FIXME: how do we get the requested attributes here in case of SD?
            // We need to get all attributes that will be disclosed, but we don't know that here
            requestedAttributes: credential?.credentialSubject
              ? Object.keys(credential.credentialSubject)
              : Object.keys(attributes),
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
