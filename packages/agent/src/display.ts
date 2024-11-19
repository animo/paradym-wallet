import type { JwkJson, W3cCredentialRecord } from '@credo-ts/core'
import {
  ClaimFormat,
  Hasher,
  JsonTransformer,
  Mdoc,
  MdocRecord,
  SdJwtVcRecord,
  TypedArrayEncoder,
} from '@credo-ts/core'
import { detectImageMimeType, formatDate, getHostNameFromUrl, isDateString, sanitizeString } from '@package/utils'
import { decodeSdJwtSync, getClaimsSync } from '@sd-jwt/decode'
import type { CredentialForDisplayId } from './hooks'
import type { OpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import type { W3cCredentialJson, W3cIssuerJson } from './types'

import { getOpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'

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

export interface DisplayImage {
  // Number is used for local images
  url?: string | number
  altText?: string
}

export interface CredentialDisplay {
  name: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  issuer: CredentialIssuerDisplay
}

export interface CredentialIssuerDisplay {
  name: string
  domain?: string
  locale?: string
  logo?: DisplayImage
}

function findDisplay<Display extends { locale?: string }>(display?: Display[]): Display | undefined {
  if (!display) return undefined

  let item = display.find((d) => d.locale?.startsWith('en-'))
  if (!item) item = display.find((d) => !d.locale)
  if (!item) item = display[0]

  return item
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

export function getOpenId4VcIssuerDisplay(
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

  // Last fallback: use issuer id from openid4vc
  if (!issuerDisplay.name && openId4VcMetadata?.issuer.id) {
    issuerDisplay.name = getHostNameFromUrl(openId4VcMetadata.issuer.id)
  }

  if (openId4VcMetadata?.issuer.id) {
    issuerDisplay.domain = getHostNameFromUrl(openId4VcMetadata.issuer.id)
  }

  return {
    ...issuerDisplay,
    name: issuerDisplay.name ?? 'Unknown',
  }
}

export function getOpenId4VcCredentialDisplay(openId4VcMetadata: OpenId4VcCredentialMetadata) {
  const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)

  const credentialDisplay: Omit<CredentialDisplay, 'name'> & { name?: string } = {
    name: openidCredentialDisplay?.name,
    description: openidCredentialDisplay?.description,
    textColor: openidCredentialDisplay?.text_color,
    backgroundColor: openidCredentialDisplay?.background_color,
    backgroundImage: openidCredentialDisplay?.background_image
      ? {
          url: openidCredentialDisplay.background_image.uri,
        }
      : undefined,
    issuer: getOpenId4VcIssuerDisplay(openId4VcMetadata),
  }

  // NOTE: logo is used in issuer display (not sure if that's right though)

  return credentialDisplay
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

function getMdocCredentialDisplay(
  credentialPayload: Record<string, unknown>,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  // TODO: mdoc
  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  // if (!credentialDisplay.name && typeof credentialPayload.vct === 'string') {
  //   credentialDisplay.name = sanitizeString(credentialPayload.vct)
  // }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}

function getSdJwtCredentialDisplay(
  credentialPayload: Record<string, unknown>,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && typeof credentialPayload.vct === 'string') {
    credentialDisplay.name = sanitizeString(credentialPayload.vct)
  }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}

export interface CredentialMetadata {
  type: string
  issuer: string
  holder?: string
  validUntil?: string
  validFrom?: string
  issuedAt?: string
}

function safeCalculateJwkThumbprint(jwk: JwkJson): string | undefined {
  try {
    const thumbprint = TypedArrayEncoder.toBase64URL(
      Hasher.hash(
        JSON.stringify({ k: jwk.k, e: jwk.e, crv: jwk.crv, kty: jwk.kty, n: jwk.n, x: jwk.x, y: jwk.y }),
        'sha-256'
      )
    )
    return `urn:ietf:params:oauth:jwk-thumbprint:sha-256:${thumbprint}`
  } catch (e) {
    return undefined
  }
}

export function filterAndMapSdJwtKeys(sdJwtVcPayload: Record<string, unknown>) {
  type SdJwtVcPayload = {
    iss: string
    cnf: Record<string, unknown>
    vct: string
    iat?: number
    nbf?: number
    exp?: number
    [key: string]: unknown
  }
  // TODO: We should map these claims to nice format and names
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _sd_alg, _sd_hash, iss, vct, cnf, iat, exp, nbf, ...visibleProperties } = sdJwtVcPayload as SdJwtVcPayload

  const holder = cnf.kid ?? cnf.jwk ? safeCalculateJwkThumbprint(cnf.jwk as JwkJson) : undefined
  const credentialMetadata: CredentialMetadata = {
    type: vct,
    issuer: iss,
    holder,
  }

  if (iat) {
    credentialMetadata.issuedAt = formatDate(new Date(iat * 1000))
  }
  if (exp) {
    credentialMetadata.validUntil = formatDate(new Date(exp * 1000))
  }
  if (nbf) {
    credentialMetadata.validFrom = formatDate(new Date(nbf * 1000))
  }

  return {
    visibleProperties: Object.fromEntries(
      Object.entries(visibleProperties).map(([key, value]) => [key, recursivelyMapAttribues(value)])
    ),
    metadata: credentialMetadata,
    raw: {
      issuedAt: iat ? new Date(iat * 1000) : undefined,
      validUntil: exp ? new Date(exp * 1000) : undefined,
      validFrom: nbf ? new Date(nbf * 1000) : undefined,
    },
  }
}

export function getDisclosedAttributePaths(payload: object, prefix = ''): Array<string> {
  let attributes: Array<string> = []

  for (const [key, value] of Object.entries(payload)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (!value) continue

    if (value && typeof value === 'object') {
      // If the value is a nested object, recurse
      attributes = attributes.concat(getDisclosedAttributePaths(value, newKey))
    } else {
      // If the value is a primitive, add the key to the list
      attributes.push(newKey)
    }
  }

  return attributes
}

export function getCredentialForDisplay(credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord) {
  if (credentialRecord instanceof SdJwtVcRecord) {
    // FIXME: we should probably add a decode method on the SdJwtVcRecord
    // as you now need the agent context to decode the sd-jwt vc, while that's
    // not really needed
    const { disclosures, jwt } = decodeSdJwtSync(credentialRecord.compactSdJwtVc, (data, alg) => Hasher.hash(data, alg))
    const decodedPayload: Record<string, unknown> = getClaimsSync(jwt.payload, disclosures, (data, alg) =>
      Hasher.hash(data, alg)
    )

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)
    const credentialDisplay = getSdJwtCredentialDisplay(decodedPayload, openId4VcMetadata)

    const mapped = filterAndMapSdJwtKeys(decodedPayload)

    return {
      id: `sd-jwt-vc-${credentialRecord.id}` satisfies CredentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: mapped.visibleProperties,
      metadata: mapped.metadata,
      claimFormat: ClaimFormat.SdJwtVc,
      validUntil: mapped.raw.validUntil,
      validFrom: mapped.raw.validFrom,
    }
  }
  if (credentialRecord instanceof MdocRecord) {
    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const credentialDisplay = getMdocCredentialDisplay({}, openId4VcMetadata)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

    const mdocInstance = Mdoc.fromBase64Url(credentialRecord.base64Url)
    const attributes = Object.fromEntries(
      Object.values(mdocInstance.issuerSignedNamespaces).flatMap((v) =>
        Object.entries(v).map(([key, value]) => [key, recursivelyMapAttribues(value)])
      )
    )

    return {
      id: `mdoc-${credentialRecord.id}` satisfies CredentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes,
      // TODO:
      metadata: {
        // holder: 'Unknown',
        issuer: 'Unknown',
        type: mdocInstance.docType,
      } satisfies CredentialMetadata,
      claimFormat: ClaimFormat.MsoMdoc,
      validUntil: mdocInstance.validityInfo.validUntil,
      validFrom: mdocInstance.validityInfo.validFrom,
    }
  }

  const credential = JsonTransformer.toJSON(
    credentialRecord.credential.claimFormat === ClaimFormat.JwtVc
      ? credentialRecord.credential.credential
      : credentialRecord.credential
  ) as W3cCredentialJson

  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
  const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
  const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

  // FIXME: support credential with multiple subjects
  const credentialAttributes = Array.isArray(credential.credentialSubject)
    ? credential.credentialSubject[0] ?? {}
    : credential.credentialSubject

  return {
    id: `w3c-credential-${credentialRecord.id}` satisfies CredentialForDisplayId,
    createdAt: credentialRecord.createdAt,
    display: {
      ...credentialDisplay,
      issuer: issuerDisplay,
    },
    credential,
    attributes: credentialAttributes,
    metadata: {
      holder: credentialRecord.credential.credentialSubjectIds[0],
      issuer: credentialRecord.credential.issuerId,
      type: credentialRecord.credential.type[credentialRecord.credential.type.length - 1],
      issuedAt: formatDate(new Date(credentialRecord.credential.issuanceDate)),
      validUntil: credentialRecord.credential.expirationDate
        ? formatDate(new Date(credentialRecord.credential.expirationDate))
        : undefined,
      validFrom: undefined,
    } satisfies CredentialMetadata,
    claimFormat: credentialRecord.credential.claimFormat,
    validUntil: credentialRecord.credential.expirationDate
      ? new Date(credentialRecord.credential.expirationDate)
      : undefined,
    validFrom: credentialRecord.credential.issuanceDate
      ? new Date(credentialRecord.credential.issuanceDate)
      : undefined,
  }
}

type MappedAttributesReturnType =
  | string
  | number
  | boolean
  | { [key: string]: MappedAttributesReturnType }
  | null
  | undefined
  | Array<MappedAttributesReturnType>
export function recursivelyMapAttribues(value: unknown): MappedAttributesReturnType {
  if (value instanceof Uint8Array) {
    const imageMimeType = detectImageMimeType(value)
    if (imageMimeType) {
      return `data:${imageMimeType};base64,${TypedArrayEncoder.toBase64(value)}`
    }

    // TODO: what to do with a buffer that is not an image?
    return TypedArrayEncoder.toUtf8String(value)
  }
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value

  if (value instanceof Date || (typeof value === 'string' && isDateString(value))) {
    // TODO: handle DateOnly (should be handled as time is 0 then)
    return formatDate(value)
  }
  if (typeof value === 'string') return value
  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value.entries()).map(([key, value]) => [key, recursivelyMapAttribues(value)]))
  }
  if (Array.isArray(value)) return value.map(recursivelyMapAttribues)

  return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, recursivelyMapAttribues(value)]))
}
