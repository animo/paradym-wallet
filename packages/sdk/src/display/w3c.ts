import { ClaimFormat, JsonTransformer, type SingleOrArray, type W3cCredentialRecord } from '@credo-ts/core'
import {
  type CredentialCategoryMetadata,
  type OpenId4VcCredentialMetadata,
  getOpenId4VcCredentialMetadata,
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

type W3cIssuerJson = {
  id: string
}

type W3cCredentialSubjectJson = {
  id?: string
  [key: string]: unknown
}

type W3cCredentialJson = {
  type: Array<string>
  issuer: W3cIssuerJson
  issuanceDate: string
  expiryDate?: string
  credentialSubject: W3cCredentialSubjectJson | W3cCredentialSubjectJson[]
}

type JffW3cCredentialJson = W3cCredentialJson & {
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
  credentialCategoryMetadata: CredentialCategoryMetadata | null
): CredentialForDisplay {
  const credential = JsonTransformer.toJSON(
    credentialRecord.credential.claimFormat === ClaimFormat.JwtVc
      ? credentialRecord.credential.credential
      : credentialRecord.credential.toJson()
  ) as W3cCredentialJson

  // TODO why is this casted to `any`?
  // biome-ignore lint/suspicious/noExplicitAny:
  const proof = (credential as any).proof as SingleOrArray<{
    type: string
    cryptosuite?: string
    verificationMethod?: string
  }>
  const firstProof = Array.isArray(proof) ? proof[0] : proof
  const isAnonCreds = firstProof.cryptosuite === 'anoncreds-2023'

  let type = credentialRecord.credential.type[credentialRecord.credential.type.length - 1]
  if (isAnonCreds) {
    type = firstProof.verificationMethod ?? type
  }

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
  const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
  const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

  // FIXME: support credential with multiple subjects
  const credentialAttributes = Array.isArray(credential.credentialSubject)
    ? credential.credentialSubject[0] ?? {}
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
      holder: credentialRecord.credential.credentialSubjectIds[0],
      issuer: credentialRecord.credential.issuerId,
      type,
      issuedAt: new Date(credentialRecord.credential.issuanceDate).toISOString(),
      validUntil: credentialRecord.credential.expirationDate
        ? new Date(credentialRecord.credential.expirationDate).toISOString()
        : undefined,
      validFrom: new Date(credentialRecord.credential.issuanceDate).toISOString(),
    },
    claimFormat: credentialRecord.credential.claimFormat,
    record: credentialRecord,
    category: credentialCategoryMetadata ?? undefined,
    hasRefreshToken,
  }
}

function getW3cIssuerDisplay(
  credential: W3cCredentialJson,
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
  const jffCredential = credential as JffW3cCredentialJson
  const issuerJson = typeof jffCredential.issuer === 'string' ? undefined : jffCredential.issuer

  // Issuer Display from JFF
  if (!issuerDisplay.logo || !issuerDisplay.logo.url) {
    if (issuerJson?.logoUrl) {
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
  credential: W3cCredentialJson,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson

  if (!credentialDisplay.name) {
    credentialDisplay.name = jffCredential.name
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && jffCredential.type.length > 1) {
    const lastType = jffCredential.type[jffCredential.type.length - 1]
    if (lastType && !lastType.startsWith('http')) {
      credentialDisplay.name = sanitizeString(lastType)
    }
  }

  // Use background color from the JFF credential if not provided by the OID4VCI metadata
  if (!credentialDisplay.backgroundColor && jffCredential.credentialBranding?.backgroundColor) {
    credentialDisplay.backgroundColor = jffCredential.credentialBranding.backgroundColor
  }

  return {
    ...credentialDisplay,
    issuer: getW3cIssuerDisplay(credential, openId4VcMetadata),
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}
