import { useMemo } from 'react'
import { useCredentialsForDisplay } from './useCredentialsForDisplay'

export type CredentialForDisplayId =
  | `w3c-credential-${string}`
  | `w3c-v2-credential-${string}`
  | `sd-jwt-vc-${string}`
  | `mdoc-${string}`

export const useCredentialForDisplayById = (credentialId: CredentialForDisplayId) => {
  const { credentials, isLoading } = useCredentialsForDisplay({ removeCanonicalRecords: false })

  return {
    isLoading,
    credential: useMemo(() => credentials.find((c) => c.id === credentialId), [credentials, credentialId]),
  }
}
