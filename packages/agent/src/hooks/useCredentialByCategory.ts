import { type ClaimFormat, MdocRecord, SdJwtVcRecord } from '@credo-ts/core'
import type { CredentialForDisplay } from '@package/sdk/src/display/credential'
import { useCredentialsForDisplay } from './useCredentialsForDisplay'

export function useCredentialByCategory(credentialCategory?: string) {
  if (!credentialCategory) {
    return {
      credentials: [],
      isLoading: false,
    } as const
  }

  const { isLoading, credentials } = useCredentialsForDisplay({
    removeCanonicalRecords: false,
    credentialCategory,
  })

  if (isLoading) {
    return {
      credentials: undefined,
      isLoading: true,
    } as const
  }

  const credential =
    credentials.find((c) => c.category?.displayPriority) ?? (credentials[0] as CredentialForDisplay | undefined)

  return {
    isLoading: false,
    credential,
    credentials,
    mdoc: credentials.find(
      (c): c is typeof c & { record: MdocRecord; claimFormat: ClaimFormat.MsoMdoc } => c.record instanceof MdocRecord
    ),
    sdJwt: credentials.find(
      (c): c is typeof c & { record: SdJwtVcRecord; claimFormat: ClaimFormat.SdJwtVc } =>
        c.record instanceof SdJwtVcRecord
    ),
  } as const
}
