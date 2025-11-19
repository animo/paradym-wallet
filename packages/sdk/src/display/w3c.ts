import {
  ClaimFormat,
  JsonTransformer,
  type SingleOrArray,
  type W3cCredentialRecord,
  type W3cJsonCredential,
  type W3cV2CredentialRecord,
  type W3cV2JsonCredential,
} from '@credo-ts/core'
import {
  type CredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  type OpenId4VcCredentialMetadata,
} from '../metadata/credentials'
import { getHostNameFromUrl } from '../utils/url'
import { findDisplay } from './common'
import type {
  CredentialDisplay,
  CredentialForDisplay,
  CredentialForDisplayId,
  CredentialIssuerDisplay,
} from './credential'
import { getOpenId4VcCredentialDisplay } from './openid4vc'
import { sanitizeString } from './strings'

export type W3cIssuerJson = {
  id: string
}

export type W3cCredentialSubjectJson = {
  id?: string
  [key: string]: unknown
}

export type W3cCredentialJson = {
  type: Array<string>
  issuer: W3cIssuerJson
  issuanceDate: string
  expiryDate?: string
  credentialSubject: W3cCredentialSubjectJson | W3cCredentialSubjectJson[]
}

export type JffW3cCredentialJson = W3cCredentialJson & {
  name?: string
  description?: string
  credentialBranding?: {
    backgroundColor?: string
  }

  issuer:
    | string
    | (W3cIssuerJson & {
        name?: string
        iconUrl?: string
        logoUrl?: string
        image?: string | { id?: string; type?: 'Image' }
      })
}

export function getDisplayInformationForW3cCredential(
  credentialRecord: W3cCredentialRecord,
  credentialForDisplayId: CredentialForDisplayId,
  hasRefreshToken: boolean,
  _credentialCategoryMetadata?: CredentialCategoryMetadata
): CredentialForDisplay {
  const credential = JsonTransformer.toJSON(
    credentialRecord.firstCredential.claimFormat === ClaimFormat.JwtVc
      ? credentialRecord.firstCredential.credential
      : credentialRecord.firstCredential.toJson()
  ) as W3cJsonCredential | W3cV2JsonCredential

  // biome-ignore lint/suspicious/noExplicitAny: No explanation
  const proof = (credential as any).proof as SingleOrArray<{
    type: string
    cryptosuite?: string
    verificationMethod?: string
  }>
  const firstProof = Array.isArray(proof) ? proof[0] : proof
  const isAnonCreds = firstProof.cryptosuite === 'anoncreds-2023'

  let type = credentialRecord.firstCredential.type[credentialRecord.firstCredential.type.length - 1]
  if (isAnonCreds) {
    type = firstProof.verificationMethod ?? type
  }

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
  const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
  const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

  // FIXME: support credential with multiple subjects
  const credentialAttributes = Array.isArray(credential.credentialSubject)
    ? (credential.credentialSubject[0] ?? {})
    : credential.credentialSubject

  return {
    id: credentialForDisplayId,
    createdAt: credentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    attributes: credentialAttributes,
    rawAttributes: credentialAttributes,
    metadata: {
      holder: credentialRecord.firstCredential.credentialSubjectIds[0],
      issuer: credentialRecord.firstCredential.issuerId,
      type,
      issuedAt: new Date(credentialRecord.firstCredential.issuanceDate).toISOString(),
      validUntil: credentialRecord.firstCredential.expirationDate
        ? new Date(credentialRecord.firstCredential.expirationDate).toISOString()
        : undefined,
      validFrom: new Date(credentialRecord.firstCredential.issuanceDate).toISOString(),
    },
    claimFormat: credentialRecord.firstCredential.claimFormat,
    record: credentialRecord,
    hasRefreshToken,
  }
}

export function getDisplayInformationForW3cV2Credential(
  credentialRecord: W3cV2CredentialRecord,
  credentialForDisplayId: CredentialForDisplayId,
  hasRefreshToken: boolean,
  credentialCategoryMetadata?: CredentialCategoryMetadata
): CredentialForDisplay {
  const resolvedCredential = credentialRecord.firstCredential.resolvedCredential
  const credential = resolvedCredential.toJSON()

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
  const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
  const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

  // FIXME: support credential with multiple subjects
  const credentialAttributes = Array.isArray(credential.credentialSubject)
    ? (credential.credentialSubject[0] ?? {})
    : credential.credentialSubject

  return {
    id: credentialForDisplayId,
    createdAt: credentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    attributes: credentialAttributes,
    rawAttributes: credentialAttributes,
    metadata: {
      holder: resolvedCredential.credentialSubjectIds[0],
      issuer: resolvedCredential.issuerId,
      type: Array.isArray(resolvedCredential.type)
        ? resolvedCredential.type[resolvedCredential.type.length - 1]
        : resolvedCredential.type,
      issuedAt: resolvedCredential.validFrom ? new Date(resolvedCredential.validFrom).toISOString() : undefined,
      validUntil: resolvedCredential.validUntil ? new Date(resolvedCredential.validUntil).toISOString() : undefined,
      validFrom: resolvedCredential.validFrom ? new Date(resolvedCredential.validFrom).toISOString() : undefined,
    },
    claimFormat: credentialRecord.firstCredential.claimFormat,
    record: credentialRecord,
    category: credentialCategoryMetadata,
    hasRefreshToken,
  }
}

function getW3cIssuerDisplay(
  credential: W3cJsonCredential | W3cV2JsonCredential,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (openId4VcMetadata) {
    const openidIssuerDisplay = findDisplay(openId4VcMetadata.issuer.display)

    if (openidIssuerDisplay) {
      issuerDisplay.name = openidIssuerDisplay.name

      if (openidIssuerDisplay.logo) {
        issuerDisplay.logo = {
          url: openidIssuerDisplay.logo?.uri,
          altText: openidIssuerDisplay.logo?.alt_text,
        }
      }
    }

    // If the credentialDisplay contains a logo, and the issuerDisplay does not, use the logo from the credentialDisplay
    const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)
    if (openidCredentialDisplay && !issuerDisplay.logo && openidCredentialDisplay.logo) {
      issuerDisplay.logo = {
        url: openidCredentialDisplay.logo?.uri,
        altText: openidCredentialDisplay.logo?.alt_text,
      }
    }
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const issuerJson = (typeof credential.issuer === 'string' ? undefined : credential.issuer) as
    | {
        name?: string
        iconUrl?: string
        logoUrl?: string
        image?: string | { id?: string; type?: 'Image' }
      }
    | undefined

  // Issuer Display from JFF
  if (!issuerDisplay.logo || !issuerDisplay.logo.url) {
    if (typeof issuerJson?.logoUrl === 'string' && issuerJson.logoUrl) {
      issuerDisplay.logo = {
        url: issuerJson?.logoUrl,
      }
    } else if (issuerJson?.image) {
      issuerDisplay.logo = {
        url: typeof issuerJson.image === 'string' ? issuerJson.image : issuerJson.image.id,
      }
    }
  }

  // Issuer name from JFF
  if (!issuerDisplay.name) {
    issuerDisplay.name = issuerJson?.name
  }

  // Last fallback: use issuer id from openid4vc
  if (!issuerDisplay.name && openId4VcMetadata?.issuer.id) {
    issuerDisplay.name = getHostNameFromUrl(openId4VcMetadata.issuer.id)
  }

  return {
    ...issuerDisplay,
    name: issuerDisplay.name ?? 'Unknown',
  }
}

function getW3cCredentialDisplay(
  credential: W3cJsonCredential | W3cV2JsonCredential,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  if (!credentialDisplay.name && typeof credential.name === 'string') {
    credentialDisplay.name = credential.name
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && credential.type.length > 1) {
    const lastType = credential.type[credential.type.length - 1]
    if (lastType && !lastType.startsWith('http')) {
      credentialDisplay.name = sanitizeString(lastType)
    }
  }

  const credentialBranding = credential.credentialBranding as { backgroundColor?: string } | undefined

  // Use background color from the JFF credential if not provided by the OID4VCI metadata
  if (!credentialDisplay.backgroundColor && credentialBranding?.backgroundColor) {
    credentialDisplay.backgroundColor = credentialBranding.backgroundColor
  }

  return {
    ...credentialDisplay,
    issuer: getW3cIssuerDisplay(credential, openId4VcMetadata),
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}
