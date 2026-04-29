import type { CredentialsForProofRequest } from '@paradym/wallet-sdk'
import { useShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export type SubmissionAuthorizationMode = 'none' | 'pin-only' | 'pin-or-biometrics'

export const getSubmissionAuthorizationMode = ({
  submission,
  shouldUseCloudHsm,
}: {
  submission?: CredentialsForProofRequest['formattedSubmission']
  shouldUseCloudHsm: boolean
}): SubmissionAuthorizationMode | undefined => {
  if (!submission) return undefined
  if (shouldUseCloudHsm) return 'pin-only'

  const isPidInSubmission = submission.entries.some(
    (entry) =>
      // TODO: should store this on the category as well so we can easily detect auth
      entry.isSatisfied && entry.credentials[0].credential.category?.credentialCategory === 'DE-PID'
  )

  return isPidInSubmission ? 'none' : 'pin-or-biometrics'
}

export const useSubmissionAuthorizationMode = (submission?: CredentialsForProofRequest['formattedSubmission']) => {
  const [shouldUseCloudHsm] = useShouldUseCloudHsm()

  return getSubmissionAuthorizationMode({
    submission,
    shouldUseCloudHsm: shouldUseCloudHsm ?? false,
  })
}
