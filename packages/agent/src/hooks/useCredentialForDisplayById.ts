import { getCredentialForDisplay } from '../display'
import { useSdJwtVcRecordById, useW3cCredentialRecordById } from '../providers'

export type CredentialForDisplayId = `w3c-credential-${string}` | `sd-jwt-vc-${string}` | `mdoc-${string}`

export const useCredentialForDisplayById = (credentialId: CredentialForDisplayId) => {
  if (credentialId.startsWith('w3c-credential-')) {
    const c = useW3cCredentialRecordById(credentialId.replace('w3c-credential-', ''))
    if (!c) return null

    return getCredentialForDisplay(c)
  }
  if (credentialId.startsWith('sd-jwt-vc-')) {
    const c = useSdJwtVcRecordById(credentialId.replace('sd-jwt-vc-', ''))
    if (!c) return null

    return getCredentialForDisplay(c)
  }

  // TODO: add mdoc
  return null
}
