import type { Kms, MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'
import type { DidCommCredentialExchangeRecord, DidCommProofExchangeRecord } from '@credo-ts/didcomm'
import type {
  OpenId4VciCredentialConfigurationSupported,
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialIssuerMetadataDisplay,
} from '@credo-ts/openid4vc'
import type { CredentialRecord } from '../storage/credentials'

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
  dpop?: { alg: Kms.KnownJwaSignatureAlgorithm; jwk: Kms.KmsJwkPublic }
}

export type OpenId4VciCredentialDisplayClaims = NonNullable<
  (OpenId4VciCredentialConfigurationSupportedWithFormats & {
    format: 'dc+sd-jwt'
  })['credential_metadata']
>['claims']

export type OpenId4VciCredentialDisplay = NonNullable<
  OpenId4VciCredentialConfigurationSupported['credential_metadata']
>['display']

export interface OpenId4VcCredentialMetadata {
  credential: {
    display?: OpenId4VciCredentialDisplay
    claims?: OpenId4VciCredentialDisplayClaims
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
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord | W3cV2CredentialRecord,
  metadata: OpenId4VcCredentialMetadata
) {
  credentialRecord.metadata.set(openId4VcCredentialMetadataKey, metadata)
}

export function extractOpenId4VcCredentialMetadata(
  credentialMetadata: OpenId4VciCredentialConfigurationSupportedWithFormats,
  serverMetadata: { display?: OpenId4VciCredentialIssuerMetadataDisplay[]; id: string }
): OpenId4VcCredentialMetadata {
  // We only store claims for the new array-based syntax
  const claims = credentialMetadata.credential_metadata?.claims ?? credentialMetadata.claims

  return {
    credential: {
      display:
        credentialMetadata.credential_metadata?.display ?? (credentialMetadata.display as OpenId4VciCredentialDisplay),
      claims: Array.isArray(claims) ? (claims as OpenId4VciCredentialDisplayClaims) : undefined,
    },
    issuer: {
      display: serverMetadata.display,
      id: serverMetadata.id,
    },
  }
}

export function getBatchCredentialMetadata(credentialRecord: CredentialRecord): BatchCredentialMetadata | null {
  return credentialRecord.metadata.get(batchCredentialMetadataKey)
}

export function getCredentialCategoryMetadata(credentialRecord: CredentialRecord): CredentialCategoryMetadata | null {
  return credentialRecord.metadata.get(credentialCategoryMetadataKey)
}

export function getRefreshCredentialMetadata(credentialRecord: CredentialRecord): RefreshCredentialMetadata | null {
  return credentialRecord.metadata.get(refreshCredentialMetadataKey)
}

export function setRefreshCredentialMetadata(credentialRecord: CredentialRecord, metadata: RefreshCredentialMetadata) {
  credentialRecord.metadata.set(refreshCredentialMetadataKey, metadata)
}

export function getOpenId4VcCredentialMetadata(credentialRecord: CredentialRecord): OpenId4VcCredentialMetadata | null {
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

export function setBatchCredentialMetadata(credentialRecord: CredentialRecord, metadata: BatchCredentialMetadata) {
  credentialRecord.metadata.set(batchCredentialMetadataKey, metadata)
}

/**
 * Gets the display metadata for the credential exchange from the given CredentialExchangeRecord.
 */
export function getDidCommCredentialExchangeDisplayMetadata(
  credentialExchangeRecord: DidCommCredentialExchangeRecord
): DidCommCredentialExchangeDisplayMetadata | null {
  return credentialExchangeRecord.metadata.get(didCommCredentialExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the credential exchange on the given CredentialExchangeRecord.
 *
 * NOTE: this does not save the record.
 */
export function setDidCommCredentialExchangeMetadata(
  credentialExchangeRecord: DidCommCredentialExchangeRecord,
  metadata: DidCommCredentialExchangeDisplayMetadata
) {
  credentialExchangeRecord.metadata.set(didCommCredentialExchangeDisplayMetadataKey, metadata)
}

/**
 * Gets the display metadata for the proof exchange from the given ProofExchangeRecord.
 */
export function getDidCommProofExchangeDisplayMetadata(
  proofExchangeRecord: DidCommProofExchangeRecord
): DidCommProofExchangeDisplayMetadata | null {
  return proofExchangeRecord.metadata.get(didCommProofExchangeDisplayMetadataKey)
}

/**
 * Sets the display metadata for the proof exchange on the given ProofExchangeRecord.
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

export function setCredentialCategoryMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: CredentialCategoryMetadata
) {
  credentialRecord.metadata.set(credentialCategoryMetadataKey, metadata)
}
