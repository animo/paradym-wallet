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
  credentialName: string
  issuerName?: string
  description?: string
  requestedAttributes?: string[]
  backgroundColor?: string
}

export function formatW3cPresentationSubmission(
  presentationSubmission: PresentationSubmission
): FormattedSubmission {
  const entries = presentationSubmission.requirements.flatMap((requirement) => {
    return requirement.submission.map((submission: SubmissionEntry) => {
      if (submission.verifiableCredential) {
        // Credential can be satisfied
        const { display, w3cCredential } = getW3cCredentialForDisplay(
          submission.verifiableCredential
        )
        return {
          name: submission.name ?? 'Unknown',
          description: submission.purpose,
          isSatisfied: true,
          credentialName: display.name,
          issuerName: display.issuer.name,
          requestedAttributes: Object.keys(w3cCredential.credentialSubject),
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
    name: presentationSubmission.name ?? 'Unknown',
    purpose: presentationSubmission.purpose,
    entries,
  }
}
