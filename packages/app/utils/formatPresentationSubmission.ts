import type {
  PresentationSubmission,
  SubmissionEntry,
} from '@internal/agent/presentations/selection'

export interface FormattedSubmission {
  name: string
  description?: string
  credentialSubject?: Record<string, unknown>
}

export function formatPresentationSubmission(
  presentationSubmission: PresentationSubmission
): FormattedSubmission[] {
  return presentationSubmission.requirements.flatMap((requirement) => {
    return requirement.submission.map((submission: SubmissionEntry) => {
      return {
        name: submission.name ?? 'Unknown',
        description: submission.purpose,
        credentialSubject:
          (submission?.verifiableCredential?.credentialSubject as Record<string, unknown>) ??
          undefined,
      }
    })
  })
}
