import type { CredentialsForProofRequest } from '@package/agent'
import { useMemo } from 'react'
import { useShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export const useShouldUsePinForSubmission = (credentialsForRequest?: CredentialsForProofRequest) => {
  const [shouldUseCloudHsm] = useShouldUseCloudHsm()

  const shouldUsePin = useMemo(() => {
    if (shouldUseCloudHsm) return true
    const isPidInSubmission =
      credentialsForRequest?.formattedSubmission?.entries.some((entry) =>
        // TODO: should store this on the category as well so we can easily detect auth
        entry.isSatisfied ? entry.credentials[0].credential.category?.credentialCategory === 'DE-PID' : false
      ) ?? false

    return !isPidInSubmission
  }, [credentialsForRequest, shouldUseCloudHsm])

  return credentialsForRequest === undefined ? undefined : shouldUsePin
}
