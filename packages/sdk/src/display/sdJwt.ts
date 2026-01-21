import { ClaimFormat, type Kms, type SdJwtVcRecord, type SdJwtVcTypeMetadata } from '@credo-ts/core'
import {
  type CredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  type OpenId4VcCredentialMetadata,
} from '../metadata/credentials'
import { safeCalculateJwkThumbprint } from '../utils/jwkThumbprint'
import { findDisplay } from './common'
import type { CredentialDisplay, CredentialForDisplay, CredentialForDisplayId, CredentialMetadata } from './credential'
import { getAttributesForDocTypeOrVct } from './docTypeOfVct'
import { recursivelyMapMdocAttributes } from './mapAttributes'
import { getOpenId4VcCredentialDisplay, getOpenId4VcIssuerDisplay } from './openid4vc'
import { sanitizeString } from './strings'

export function getDisplayInformationForSdJwtCredential(
  credentialRecord: SdJwtVcRecord,
  credentialForDisplayId: CredentialForDisplayId,
  hasRefreshToken: boolean,
  credentialCategoryMetadata?: CredentialCategoryMetadata
): CredentialForDisplay {
  const sdJwtVc = credentialRecord.firstCredential

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord) ?? undefined
  const sdJwtTypeMetadata = credentialRecord.typeMetadata
  const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

  const credentialDisplay = getSdJwtCredentialDisplay(sdJwtVc.prettyClaims, openId4VcMetadata, sdJwtTypeMetadata)
  const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(sdJwtVc.prettyClaims)

  // FIXME: For now, we map attributes to our custom attributes for PID and MDL
  // We should add support for attributes from Type Metadata and OID4VC Metadata

  // Order of precedence should be:
  // 1. Custom attributes for PID and MDL using category
  // 2. Attributes from SD JWT Type Metadata
  // 3. Attributes from OID4VC Metadata

  const customAttributesForDisplay =
    getAttributesForDocTypeOrVct({
      type: sdJwtVc.payload.vct as string,
      attributes,
    }) ?? attributes

  return {
    id: credentialForDisplayId,
    createdAt: credentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    attributes: customAttributesForDisplay,
    rawAttributes: attributes,
    metadata,
    claimFormat: ClaimFormat.SdJwtDc,
    record: credentialRecord,
    category: credentialCategoryMetadata ?? undefined,
    hasRefreshToken,
  }
}

function getSdJwtTypeMetadataCredentialDisplay(
  sdJwtTypeMetadata: SdJwtVcTypeMetadata
): Omit<CredentialDisplay, 'issuer' | 'name'> & { name?: string } {
  const typeMetadataDisplay = findDisplay(sdJwtTypeMetadata.display)

  // TODO: support SVG rendering method

  const credentialDisplay = {
    name: typeMetadataDisplay?.name,
    description: typeMetadataDisplay?.description,
    textColor: typeMetadataDisplay?.rendering?.simple?.text_color,
    backgroundColor: typeMetadataDisplay?.rendering?.simple?.background_color,
    backgroundImage: typeMetadataDisplay?.rendering?.simple?.logo
      ? {
          url: typeMetadataDisplay?.rendering?.simple?.logo.uri,
          altText: typeMetadataDisplay?.rendering?.simple?.logo.alt_text,
        }
      : undefined,
  }

  return credentialDisplay
}

function getSdJwtCredentialDisplay(
  credentialPayload: Record<string, unknown>,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null,
  typeMetadata?: SdJwtVcTypeMetadata | null
) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  // TODO: should we combine them? I think not really needed if you have one of them
  // Type metadata takes precendence.
  if (typeMetadata) {
    credentialDisplay = getSdJwtTypeMetadataCredentialDisplay(typeMetadata)
  } else if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && typeof credentialPayload.vct === 'string') {
    credentialDisplay.name = sanitizeString(credentialPayload.vct) as string
  }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}

export function getAttributesAndMetadataForSdJwtPayload(sdJwtVcPayload: Record<string, unknown>) {
  type SdJwtVcPayload = {
    iss: string
    cnf: Record<string, unknown>
    vct: string
    iat?: number
    nbf?: number
    exp?: number
    [key: string]: unknown
  }
  const { _sd_alg, _sd_hash, iss, vct, cnf, iat, exp, nbf, status, ...visibleProperties } =
    sdJwtVcPayload as SdJwtVcPayload

  const holder = cnf ? ((cnf.kid ?? cnf.jwk) ? safeCalculateJwkThumbprint(cnf.jwk as Kms.Jwk) : undefined) : undefined
  const credentialMetadata: CredentialMetadata = {
    type: vct,
    issuer: iss,
    holder,
    issuedAt: iat ? new Date(iat * 1000).toISOString() : undefined,
    validUntil: exp ? new Date(exp * 1000).toISOString() : undefined,
    validFrom: nbf ? new Date(nbf * 1000).toISOString() : undefined,
    status,
  }

  return {
    attributes: Object.fromEntries(
      Object.entries(visibleProperties).map(([key, value]) => [key, recursivelyMapMdocAttributes(value)])
    ),
    metadata: credentialMetadata,
  }
}
