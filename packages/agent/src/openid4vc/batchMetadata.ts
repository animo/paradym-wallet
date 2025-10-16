import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'

export interface BatchCredentialMetadata {
  /**
   * Additional credentials that can be used for presentation
   */
  additionalCredentials: Array<string> | Array<Record<string, unknown>>
}

const batchCredentialMetadataKey = '_paradym/batchCredentialMetadata'

/**
 * Gets the batch credential metadata from the given credential record.
 */
export function getBatchCredentialMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
): BatchCredentialMetadata | null {
  return credentialRecord.metadata.get(batchCredentialMetadataKey)
}

/**
 * Sets the batch credential metadata on the given credential record
 *
 * NOTE: this does not save the record.
 */
export function setBatchCredentialMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: BatchCredentialMetadata
) {
  credentialRecord.metadata.set(batchCredentialMetadataKey, metadata)
}
