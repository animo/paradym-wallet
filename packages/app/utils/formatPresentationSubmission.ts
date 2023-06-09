import type {
  PresentationSubmission,
  SubmissionEntry,
} from '@internal/agent/presentations/selection'

import { getCredentialForDisplay } from '@internal/agent'

export interface FormattedSubmission {
  name: string
  isSatisfied: boolean
  description?: string
  requestedAttributes?: string[]
}

export function formatPresentationSubmission(
  presentationSubmission: PresentationSubmission
): FormattedSubmission[] {
  return presentationSubmission.requirements.flatMap((requirement) => {
    return requirement.submission.map((submission: SubmissionEntry) => {
      return {
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        isSatisfied: submission?.verifiableCredential !== undefined,
        requestedAttributes: submission?.verifiableCredential
          ? Object.keys(
              getCredentialForDisplay(submission.verifiableCredential).credential.credentialSubject
            )
          : [],
      }
    })
  })
}
