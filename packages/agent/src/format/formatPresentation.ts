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
  name: string
  isSatisfied: boolean
  credentialName: string
  issuerName?: string
  description?: string
  requestedAttributes?: string[]
  backgroundColor?: string
}

export function formatDifPexCredentialsForRequest(
  credentialsForRequest: DifPexCredentialsForRequest
): FormattedSubmission {
  const entries = credentialsForRequest.requirements.flatMap((requirement) => {
    return requirement.submissionEntry.map((submission) => {
      // FIXME: support credential selection from JFF branch
      const [firstVerifiableCredential] = submission.verifiableCredentials
      if (firstVerifiableCredential) {
        // Credential can be satisfied
        const { display, credential } = getCredentialForDisplay(
          firstVerifiableCredential.credentialRecord
        )

        // TODO: support nesting
        let requestedAttributes: string[]
        if (firstVerifiableCredential.type === ClaimFormat.SdJwtVc) {
          const { metadata, visibleProperties } = filterAndMapSdJwtKeys(
            firstVerifiableCredential.disclosedPayload
          )
          requestedAttributes = [...Object.keys(visibleProperties), ...Object.keys(metadata)]
        } else {
          requestedAttributes = Object.keys(credential?.credentialSubject ?? {})
        }

        return {
          name: submission.name ?? 'Unknown',
          description: submission.purpose,
          isSatisfied: true,
          credentialName: display.name,
          issuerName: display.issuer.name,
          requestedAttributes,
          backgroundColor: display.backgroundColor,
        }
      }
      return {
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: false,
        // fallback to submission name because there is no credential
        credentialName: submission.name ?? 'Credential name',
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
