import type { MdocRecord, SdJwtVcRecord, W3cCredentialRecord } from '@credo-ts/core'
import type {
  OpenId4VciCredentialConfigurationSupported,
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciCredentialIssuerMetadataDisplay,
} from '@credo-ts/openid4vc'

export type CredentialDisplayClaims = (OpenId4VciCredentialConfigurationSupportedWithFormats & {
  format: 'vc+sd-jwt'
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

const openId4VcCredentialMetadataKey = '_paradym/openId4VcCredentialMetadata'

export function extractOpenId4VcCredentialMetadata(
  credentialMetadata: OpenId4VciCredentialConfigurationSupportedWithFormats,
  serverMetadata: { display?: OpenId4VciCredentialIssuerMetadataDisplay[]; id: string }
): OpenId4VcCredentialMetadata {
  return {
    credential: {
      display: credentialMetadata.display,
      order: credentialMetadata.order,
      // NOTE: w3c vcs do not use claims, we can add rendering for that later
      claims:
        credentialMetadata.format === 'vc+sd-jwt' || credentialMetadata.format === 'mso_mdoc'
          ? credentialMetadata.claims
          : undefined,
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

/**
 * Sets the OpenId4Vc credential metadata on the given credential record
 *
 * NOTE: this does not save the record.
 */
export function setOpenId4VcCredentialMetadata(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  metadata: OpenId4VcCredentialMetadata
) {
  credentialRecord.metadata.set(openId4VcCredentialMetadataKey, metadata)
}
