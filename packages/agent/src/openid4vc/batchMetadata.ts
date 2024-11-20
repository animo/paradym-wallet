import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'

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
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): BatchCredentialMetadata | null {
  return credentialRecord.metadata.get(batchCredentialMetadataKey)
}

/**
 * Sets the batch credential metadata on the given credential record
 *
 * NOTE: this does not save the record.
 */
export function setBatchCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: BatchCredentialMetadata
) {
  credentialRecord.metadata.set(batchCredentialMetadataKey, metadata)
}
