import { ClaimFormat } from '@credo-ts/core'
import { getCredentialForDisplay } from '../display'
import { useMdocRecordById, useSdJwtVcRecordById, useW3cCredentialRecordById } from '../providers'

export type CredentialForDisplayId = `w3c-credential-${string}` | `sd-jwt-vc-${string}` | `mdoc-${string}`
export function getCredentialDisplayId(
  credentialId: string,
  claimFormat: ClaimFormat | 'AnonCreds'
): CredentialForDisplayId {
  if (
    credentialId.startsWith('w3c-credential-') ||
    credentialId.startsWith('sd-jwt-vc-') ||
    credentialId.startsWith('mdoc-')
  ) {
    return credentialId as CredentialForDisplayId
  }

  if (claimFormat === ClaimFormat.MsoMdoc) {
    return `mdoc-${credentialId}` as const
  }

  if (claimFormat === ClaimFormat.LdpVc || claimFormat === ClaimFormat.JwtVc) {
    return `w3c-credential-${credentialId}` as const
  }

  if (claimFormat === ClaimFormat.SdJwtVc) {
    return `sd-jwt-vc-${credentialId}` as const
  }

  throw new Error(`Unsupported claim format ${claimFormat}`)
}

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
  if (credentialId.startsWith('mdoc-')) {
    const c = useMdocRecordById(credentialId.replace('mdoc-', ''))
    if (!c) return null

    return getCredentialForDisplay(c)
  }

  return null
}
