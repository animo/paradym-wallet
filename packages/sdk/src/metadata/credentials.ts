import type { JwaSignatureAlgorithm, JwkJson, MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import type { CredentialExchangeRecord, ProofExchangeRecord } from '@credo-ts/didcomm'
import type {
  OpenId4VciCredentialConfigurationSupported,
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialIssuerMetadataDisplay,
} from '@credo-ts/openid4vc'

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

export interface BatchCredentialMetadata {
  /**
   * Additional credentials that can be used for presentation
   */
  additionalCredentials: Array<string> | Array<Record<string, unknown>>
}

export interface RefreshCredentialMetadata {
  refreshToken: string
  dpop?: { alg: JwaSignatureAlgorithm; jwk: JwkJson }
}

export type CredentialDisplayClaims =
  | (OpenId4VciCredentialConfigurationSupportedWithFormats & {
      format: 'vc+sd-jwt'
    })['claims']
  | (OpenId4VciCredentialConfigurationSupportedWithFormats & {
      format: 'dc+sd-jwt'
    })['claims']

export interface OpenId4VcCredentialMetadata {
  credential: {
    display?: OpenId4VciCredentialConfigurationSupported['display']
    claims?: CredentialDisplayClaims
    order?: OpenId4VciCredentialConfigurationSupportedWithFormats['order']
  }
  issuer: {
    display?: OpenId4VciCredentialIssuerMetadataDisplay[]
    id: string
  }
}

export interface BatchCredentialMetadata {
  /**
   * Additional credentials that can be used for presentation
   */
  additionalCredentials: Array<string> | Array<Record<string, unknown>>
}

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

const openId4VcCredentialMetadataKey = '_paradym/openId4VcCredentialMetadata'
const batchCredentialMetadataKey = '_paradym/batchCredentialMetadata'
const credentialCategoryMetadataKey = '_paradym/credentialCategoryMetadata'
const refreshCredentialMetadataKey = '_paradym/refreshCredentialMetadata'
const didCommCredentialExchangeDisplayMetadataKey = '_paradym/credentialDisplayMetadata'
const didCommProofExchangeDisplayMetadataKey = '_paradym/proofDisplayMetadata'

export function setOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: OpenId4VcCredentialMetadata
) {
  credentialRecord.metadata.set(openId4VcCredentialMetadataKey, metadata)
}

export function extractOpenId4VcCredentialMetadata(
  credentialMetadata: OpenId4VciCredentialConfigurationSupportedWithFormats,
  serverMetadata: { display?: OpenId4VciCredentialIssuerMetadataDisplay[]; id: string }
): OpenId4VcCredentialMetadata {
  return {
    credential: {
      display: credentialMetadata.display,
      order: credentialMetadata.order,
      claims: credentialMetadata.claims ? (credentialMetadata.claims as CredentialDisplayClaims) : undefined,
    },
    issuer: {
      display: serverMetadata.display,
      id: serverMetadata.id,
    },
  }
}

export function getBatchCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): BatchCredentialMetadata | null {
  return credentialRecord.metadata.get(batchCredentialMetadataKey)
}

export function getCredentialCategoryMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialCategoryMetadata | null {
  return credentialRecord.metadata.get(credentialCategoryMetadataKey)
}

export function getRefreshCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): RefreshCredentialMetadata | null {
  return credentialRecord.metadata.get(refreshCredentialMetadataKey)
}

export function setRefreshCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: RefreshCredentialMetadata
) {
  credentialRecord.metadata.set(refreshCredentialMetadataKey, metadata)
}

export function getOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): OpenId4VcCredentialMetadata | null {
  const recordMetadata: OpenId4VcCredentialMetadata | null =
    credentialRecord.metadata.get(openId4VcCredentialMetadataKey)

  if (!recordMetadata) return null

  return {
    issuer: {
      ...recordMetadata.issuer,
      display: recordMetadata.issuer.display?.map(({ logo, ...displayRest }) => ({
        ...displayRest,
        // We need to map the url values to uri
        logo: logo ? { ...logo, uri: logo.uri ?? (logo.url as string) } : undefined,
      })),
    },
    credential: {
      ...recordMetadata.credential,
      display: recordMetadata.credential.display?.map(({ background_image, logo, ...displayRest }) => ({
        ...displayRest,
        // We need to map the url values to uri
        background_image: background_image
          ? { ...background_image, uri: background_image.uri ?? (background_image.url as string) }
          : undefined,
        // We need to map the url values to uri
        logo: logo ? { ...logo, uri: logo.uri ?? (logo.url as string) } : undefined,
      })),
    },
  }
}

export function setBatchCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: BatchCredentialMetadata
) {
  credentialRecord.metadata.set(batchCredentialMetadataKey, metadata)
}

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

export function openIdCredentialMetadataFromDidCommCredentialExchangeMetadata(
  credentialExchangeRecord: CredentialExchangeRecord,
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
