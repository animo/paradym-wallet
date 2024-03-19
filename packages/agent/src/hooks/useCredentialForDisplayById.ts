import { useCredentialById as _useCredentialById } from '@credo-ts/react-hooks'

import { getCredentialExchangeForDisplay, getCredentialForDisplay } from '../display'
import { useSdJwtVcRecordById, useW3cCredentialRecordById } from '../providers'

export type CredentialForDisplayId =
  | `credential-exchange-${string}`
  | `w3c-credential-${string}`
  | `sd-jwt-vc-${string}`

export const useCredentialForDisplayById = (credentialId: CredentialForDisplayId) => {
  if (credentialId.startsWith('credential-exchange-')) {
    const c = _useCredentialById(credentialId.replace('credential-exchange-', ''))
    if (!c) return null

    return getCredentialExchangeForDisplay(c)
  } else if (credentialId.startsWith('w3c-credential-')) {
    const c = useW3cCredentialRecordById(credentialId.replace('w3c-credential-', ''))
    if (!c) return null

    return getCredentialForDisplay(c)
  } else if (credentialId.startsWith('sd-jwt-vc-')) {
    const c = useSdJwtVcRecordById(credentialId.replace('sd-jwt-vc-', ''))
    if (!c) return null

    return getCredentialForDisplay(c)
  }
}
