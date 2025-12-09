import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord, W3cV2CredentialRecord } from '@credo-ts/core'
import type {
  OpenId4VciCredentialConfigurationSupported,
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialIssuerMetadataDisplay,
} from '@credo-ts/openid4vc'

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
  }
  issuer: {
    display?: OpenId4VciCredentialIssuerMetadataDisplay[]
    id: string
  }
}

const openId4VcCredentialMetadataKey = '_paradym/openId4VcCredentialMetadata'

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

/**
 * Gets the OpenId4Vc credential metadata from the given credential record.
 */
export function getOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
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
      // We might have stored non-array claims syntax in the past. We don't want to use these
      claims: Array.isArray(recordMetadata.credential.claims) ? recordMetadata.credential.claims : undefined,
    },
  }
}

/**
 * Sets the OpenId4Vc credential metadata on the given credential record
 *
 * NOTE: this does not save the record.
 */
export function setOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: OpenId4VcCredentialMetadata
) {
  credentialRecord.metadata.set(openId4VcCredentialMetadataKey, metadata)
}
