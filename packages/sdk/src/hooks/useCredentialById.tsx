import { useMemo } from 'react'
import { useCredentials } from './useCredentials'

export type CredentialId =
  | `w3c-credential-${string}`
  | `w3c-v2-credential-${string}`
  | `sd-jwt-vc-${string}`
  | `mdoc-${string}`

export const useCredentialById = (credentialId: CredentialId) => {
  const { credentials, isLoading } = useCredentials({ removeCanonicalRecords: false })

  return {
    isLoading,
    credential: useMemo(() => credentials.find((c) => c.id === credentialId), [credentials, credentialId]),
  }
}
