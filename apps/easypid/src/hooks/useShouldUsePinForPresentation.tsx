import type { CredentialsForProofRequest } from '@package/agent'
import { useMemo } from 'react'
import { useShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export const useShouldUsePinForSubmission = (submission?: CredentialsForProofRequest['formattedSubmission']) => {
  const [shouldUseCloudHsm] = useShouldUseCloudHsm()

  const shouldUsePin = useMemo(() => {
    if (shouldUseCloudHsm) return true
    const isPidInSubmission =
      submission?.entries.some((entry) =>
        // TODO: should store this on the category as well so we can easily detect auth
        entry.isSatisfied ? entry.credentials[0].credential.category?.credentialCategory === 'DE-PID' : false
      ) ?? false

    return !isPidInSubmission
  }, [submission, shouldUseCloudHsm])

  return submission === undefined ? undefined : shouldUsePin
}
