import type { PresentationSubmission, SubmissionEntry } from '@internal/openid4vc-client'

import { getW3cCredentialForDisplay } from '../display'

export interface FormattedSubmission {
  name: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
}

export interface FormattedSubmissionEntry {
  name: string
  isSatisfied: boolean
  description?: string

  credentials: Array<{
    credentialName: string
    issuerName?: string
    requestedAttributes: string[]
    backgroundColor?: string
  }>
}

export function formatW3cPresentationSubmission(
  presentationSubmission: PresentationSubmission
): FormattedSubmission {
  const entries = presentationSubmission.requirements.flatMap((requirement) => {
    return requirement.submission.map((submission: SubmissionEntry) => {
      return {
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: submission.verifiableCredentials.length >= 1,

        credentials: submission.verifiableCredentials.map((credential) => {
          // Credential can be satisfied
          const { display, w3cCredential } = getW3cCredentialForDisplay(credential)

          return {
            credentialName: display.name,
            issuerName: display.issuer.name,
            requestedAttributes: Object.keys(w3cCredential.credentialSubject),
            backgroundColor: display.backgroundColor,
          }
        }),
      }
    })
  })

  return {
    areAllSatisfied: entries.every((entry) => entry.isSatisfied),
    name: presentationSubmission.name ?? 'Unknown',
    purpose: presentationSubmission.purpose,
    entries,
  }
}
