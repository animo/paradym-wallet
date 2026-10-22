import { isHardwareBoundCredentialType } from '@app/config/paymentAttestation'
import type { CredentialsForProofRequest } from '@paradym/wallet-sdk'
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

    // A hardware-bound credential's key asks for a strong biometric on every signature, so presenting
    // it already takes possession (the key) and inherence (the biometric) — two SCA factors without
    // the PIN. Not with the cloud HSM, which has no local biometric and is handled above.
    const isHardwareBoundCredentialInSubmission =
      submission?.entries.some((entry) =>
        entry.isSatisfied ? isHardwareBoundCredentialType(entry.credentials[0].credential.metadata.type) : false
      ) ?? false

    return !isPidInSubmission && !isHardwareBoundCredentialInSubmission
  }, [submission, shouldUseCloudHsm])

  return submission === undefined ? undefined : shouldUsePin
}
