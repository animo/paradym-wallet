import type { CredentialExchangeRecord, ProofExchangeRecord } from '@credo-ts/core'

export interface DidCommCredentialExchangeDisplayMetadata {
  issuerName?: string
  credentialName?: string
}

export interface DidCommProofExchangeDisplayMetadata {
  verifierName?: string
  proofName?: string
}

const didCommCredentialExchangeDisplayMetadataKey = '_paradym/credentialDisplayMetadata'
const didCommProofExchangeDisplayMetadataKey = '_paradym/proofDisplayMetadata'

/**
 * Gets the display metadata for the credential exchange from the given CredentialExchangeRecord.
 */
export function getDidCommCredentialExchangeDisplayMetadata(
  credentialExchangeRecord: CredentialExchangeRecord
): DidCommCredentialExchangeDisplayMetadata | null {
  return credentialExchangeRecord.metadata.get(didCommCredentialExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the credential exchange on the given CredentialExchangeRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommCredentialExchangeMetadata(
  credentialExchangeRecord: CredentialExchangeRecord,
  metadata: DidCommCredentialExchangeDisplayMetadata
) {
  credentialExchangeRecord.metadata.set(didCommCredentialExchangeDisplayMetadataKey, metadata)
}

/**
 * Gets the display metadata for the proof exchange from the given ProofExchangeRecord.
 */
export function getDidCommProofExchangeDisplayMetadata(
  proofExchangeRecord: ProofExchangeRecord
): DidCommProofExchangeDisplayMetadata | null {
  return proofExchangeRecord.metadata.get(didCommProofExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the proof exchange on the given ProofExchangeRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommProofExchangeMetadata(
  proofExchangeRecord: ProofExchangeRecord,
  metadata: DidCommProofExchangeDisplayMetadata
) {
  proofExchangeRecord.metadata.set(didCommProofExchangeDisplayMetadataKey, metadata)
}
