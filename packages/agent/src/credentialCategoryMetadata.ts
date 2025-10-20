import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'

export interface CredentialCategoryMetadata {
  /**
   *
   */
  credentialCategory: 'DE-PID' | (string & {})

  /**
   * Whether this instance of the canonical records should be displayed by default
   */
  displayPriority?: boolean

  /**
   * @default true
   */
  canDeleteCredential?: boolean

  // TODO: we can also store here the key binding requirements, and whether we need to sign
  // locally or remotely (so we can show PIN)
}

const credentialCategoryMetadataKey = '_paradym/credentialCategoryMetadata'

/**
 * Gets the credential type metadata from the given credential record.
 */
export function getCredentialCategoryMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialCategoryMetadata | null {
  return credentialRecord.metadata.get(credentialCategoryMetadataKey)
}

/**
 * Sets the credential type metadata on the given credential record
 *
 * NOTE: this does not save the record.
 */
export function setCredentialCategoryMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: CredentialCategoryMetadata
) {
  credentialRecord.metadata.set(credentialCategoryMetadataKey, metadata)
}
