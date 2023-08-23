import { useCredentialById as _useCredentialById } from '@aries-framework/react-hooks'

import { getCredentialExchangeForDisplay, getW3cCredentialForDisplay } from '../display'
import { useW3cCredentialRecordById } from '../providers'

export type CredentialForDisplayId = `credential-exchange-${string}` | `w3c-credential-${string}`

export const useCredentialForDisplayById = (credentialId: CredentialForDisplayId) => {
  if (credentialId.startsWith('credential-exchange-')) {
    const c = _useCredentialById(credentialId.replace('credential-exchange-', ''))
    if (!c) return null

    return getCredentialExchangeForDisplay(c)
  } else if (credentialId.startsWith('w3c-credential-')) {
    const c = useW3cCredentialRecordById(credentialId.replace('w3c-credential-', ''))
    if (!c) return null

    return getW3cCredentialForDisplay(c)
  }
}
