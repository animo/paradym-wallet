import type { PresentationSubmission, SubmissionEntry } from '@internal/openid4vc-client'

import { getCredentialForDisplay } from '@internal/agent'

export interface FormattedSubmission {
  name: string
  isSatisfied: boolean
  credentialName: string
  issuerName?: string
  description?: string
  requestedAttributes?: string[]
}

export function formatPresentationSubmission(
  presentationSubmission: PresentationSubmission
): FormattedSubmission[] {
  return presentationSubmission.requirements.flatMap((requirement) => {
    return requirement.submission.map((submission: SubmissionEntry) => {
      if (submission.verifiableCredential) {
        // Credential can be satisfied
        const { display, credential } = getCredentialForDisplay(submission.verifiableCredential)
        return {
          name: submission.name ?? 'Unknown',
          description: submission.purpose,
          isSatisfied: true,
          credentialName: display.name,
          issuerName: display.issuer.name,
          requestedAttributes: Object.keys(credential.credentialSubject),
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
}
