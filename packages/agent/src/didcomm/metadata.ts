import type { DidCommCredentialExchangeRecord, DidCommProofExchangeRecord } from '@credo-ts/didcomm'
import type { OpenId4VcCredentialMetadata } from '../openid4vc/displayMetadata'

// TODO: store this on the credential record
export interface DidCommCredentialExchangeDisplayMetadata {
  issuerName?: string
  issuerLogoUri?: string
  credentialName?: string
}

export interface DidCommProofExchangeDisplayMetadata {
  verifierName?: string
  verifierLogoUri?: string
  proofName?: string
}

const didCommCredentialExchangeDisplayMetadataKey = '_paradym/credentialDisplayMetadata'
const didCommProofExchangeDisplayMetadataKey = '_paradym/proofDisplayMetadata'

/**
 * Gets the display metadata for the credential exchange from the given DidCommCredentialExchangeRecord.
 */
export function getDidCommCredentialExchangeDisplayMetadata(
  DidCommCredentialExchangeRecord: DidCommCredentialExchangeRecord
): DidCommCredentialExchangeDisplayMetadata | null {
  return DidCommCredentialExchangeRecord.metadata.get(didCommCredentialExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the credential exchange on the given DidCommCredentialExchangeRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommCredentialExchangeMetadata(
  DidCommCredentialExchangeRecord: DidCommCredentialExchangeRecord,
  metadata: DidCommCredentialExchangeDisplayMetadata
) {
  DidCommCredentialExchangeRecord.metadata.set(didCommCredentialExchangeDisplayMetadataKey, metadata)
}

/**
 * Gets the display metadata for the proof exchange from the given DidCommProofExchangeRecord.
 */
export function getDidCommProofExchangeDisplayMetadata(
  proofExchangeRecord: DidCommProofExchangeRecord
): DidCommProofExchangeDisplayMetadata | null {
  return proofExchangeRecord.metadata.get(didCommProofExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the proof exchange on the given DidCommProofExchangeRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommProofExchangeMetadata(
  proofExchangeRecord: DidCommProofExchangeRecord,
  metadata: DidCommProofExchangeDisplayMetadata
) {
  proofExchangeRecord.metadata.set(didCommProofExchangeDisplayMetadataKey, metadata)
}

export function openIdCredentialMetadataFromDidCommCredentialExchangeMetadata(
  credentialExchangeRecord: DidCommCredentialExchangeRecord,
  didcommMetadata: DidCommCredentialExchangeDisplayMetadata
): OpenId4VcCredentialMetadata {
  return {
    credential: {
      display: didcommMetadata.credentialName
        ? [
            {
              name: didcommMetadata?.credentialName,
            },
          ]
        : undefined,
    },
    issuer: {
      id: credentialExchangeRecord.connectionId ?? credentialExchangeRecord.id,
      display: didcommMetadata.issuerName
        ? [
            {
              name: didcommMetadata?.issuerName,
              logo: didcommMetadata.issuerLogoUri
                ? {
                    uri: didcommMetadata.issuerLogoUri,
                  }
                : undefined,
            },
          ]
        : undefined,
    },
  }
}
