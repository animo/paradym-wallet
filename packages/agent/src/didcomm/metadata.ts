import type { CredentialExchangeRecord } from '@aries-framework/core'

export interface DidCommCredentialExchangeDisplayMetadata {
  issuerName?: string
  credentialName?: string
}

const didCommCredentialExchangeDisplayMetadataKey = '_paradym/displayMetadata'

/**
 * Gets the display metadata for the credential exchange from the given CredentialExchangeRecord.
 */
export function getDidCommCredentialExchangeDisplayMetadata(
  credentialExchangeRecord: CredentialExchangeRecord
): DidCommCredentialExchangeDisplayMetadata | null {
  return credentialExchangeRecord.metadata.get(didCommCredentialExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the credential exchange on the given CredentialExchangRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommCredentialExchangeMetadata(
  credentialExchangeRecord: CredentialExchangeRecord,
  metadata: DidCommCredentialExchangeDisplayMetadata
) {
  credentialExchangeRecord.metadata.set(didCommCredentialExchangeDisplayMetadataKey, metadata)
}
