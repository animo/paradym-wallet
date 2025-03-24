import {
  DateOnly,
  type JwkJson,
  type MdocNameSpaces,
  type SdJwtVcTypeMetadata,
  type SingleOrArray,
  W3cCredentialRecord,
  getJwkFromKey,
} from '@credo-ts/core'
import {
  ClaimFormat,
  Hasher,
  JsonTransformer,
  type Mdoc,
  MdocRecord,
  SdJwtVcRecord,
  TypedArrayEncoder,
} from '@credo-ts/core'
import { detectImageMimeType, formatDate, getHostNameFromUrl, isDateString, sanitizeString } from '@package/utils'
import type { CredentialForDisplayId } from './hooks'
import type { OpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import type { W3cCredentialJson, W3cIssuerJson } from './types'

import { type CredentialCategoryMetadata, getCredentialCategoryMetadata } from './credentialCategoryMetadata'
import { getAttributesForCategory } from './display/category'
import { getAttributesForDocTypeOrVct } from './display/docTypeOrVct'
import type { FormattedSubmissionEntrySatisfiedCredential } from './format/formatPresentation'
import { getOpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'

/**
 * Paths that were requested but couldn't be satisfied.
 * Maybe belongs in agent, but adding here because the `nonRenderedPaths` is
 * very intertwined with our rendering logic
 */
export function getUnsatisfiedAttributePathsForDisplay(paths: Array<string | number | null>[]) {
  const nonRenderedPaths = ['iss', 'vct']
  return Array.from(
    new Set(
      paths
        .filter(
          (path): path is [string] =>
            typeof path[0] === 'string' && !path.some((p) => nonRenderedPaths.includes(p as string))
        )
        .map((path) => sanitizeString(path[0]))
    )
  )
}

/**
 * Paths that were requested and we have a matching credential for.
 * This list is used for two purposes:
 *  - rendering attribute names in card preview
 *  - rendering how many attributes (count) will be shared
 */
export function getDisclosedAttributeNamesForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  // FIXME: this implementation in still too naive
  // TODO: use the credential claim metadata (sd-jwt / oid4vc) to get labels for attribute paths
  // TODO: we miss e.g. showing age_equal_or_over.21 as Age Over 21, but with the display metadata
  // from bdr we can at least show it as: Age verification. If there is a key for a nested path we can
  // also decide to include it

  // For mdoc we remove the namespaces
  if (credential.credential.claimFormat === ClaimFormat.MsoMdoc) {
    return Array.from(new Set(credential.disclosed.paths.map((path) => sanitizeString(path[1]))))
  }

  // Otherwise we take the top-level keys
  return Array.from(
    new Set(
      credential.disclosed.paths
        .filter((path): path is [string] => typeof path[0] === 'string')
        .map((path) => sanitizeString(path[0]))
    )
  )
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

export interface CredentialMetadata {
  /**
   * vct (sd-jwt) or doctype (mdoc) or last type entry (w3c)
   */
  type: string

  /**
   * issuer identifier. did or https url
   */
  issuer?: string

  /**
   * Holder identifier. did or jwk thubmprint
   */
  holder?: string

  validUntil?: string
  validFrom?: string
  issuedAt?: string

  hasRefreshToken?: boolean

  // TODO: define and render
  status?: unknown
}

export function metadataForDisplay(metadata: CredentialMetadata) {
  const { type, holder, issuedAt, issuer, validFrom, validUntil } = metadata

  return {
    type,
    issuer,
    holder,
    issuedAt: issuedAt ? formatDate(new Date(issuedAt)) : undefined,
    validFrom: validFrom ? formatDate(new Date(validFrom)) : undefined,
    validUntil: validUntil ? formatDate(new Date(validUntil)) : undefined,
  }
}

export interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay
  attributes: Record<string, unknown>
  rawAttributes: Record<string, unknown>
  metadata: CredentialMetadata
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc | ClaimFormat.JwtVc | ClaimFormat.LdpVc
  record: W3cCredentialRecord | MdocRecord | SdJwtVcRecord

  category: CredentialCategoryMetadata | null
  hasRefreshToken: boolean
}

function findDisplay<Display extends { locale?: string; lang?: string }>(display?: Display[]): Display | undefined {
  if (!display) return undefined

  let item = display.find((d) => d.locale?.startsWith('en-') || d.lang?.startsWith('en-'))
  if (!item) item = display.find((d) => !d.locale && !d.lang)
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

export function getCredentialDisplayWithDefaults(credentialDisplay?: Partial<CredentialDisplay>): CredentialDisplay {
  return {
    ...credentialDisplay,
    name: credentialDisplay?.name ?? 'Credential',
    issuer: {
      ...credentialDisplay?.issuer,
      name: credentialDisplay?.issuer?.name ?? 'Unknown',
    },
  }
}

export function getSdJwtTypeMetadataCredentialDisplay(
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

function getMdocCredentialDisplay(mdoc: Mdoc, openId4VcMetadata?: OpenId4VcCredentialMetadata | null) {
  let credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    credentialDisplay = getOpenId4VcCredentialDisplay(openId4VcMetadata)
  }

  return {
    ...credentialDisplay,
    // If there's no name for the credential, we extract it from the doctype
    name: credentialDisplay.name ?? mdoc.docType,
  }
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
    credentialDisplay.name = sanitizeString(credentialPayload.vct)
  }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
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
export function getAttributesAndMetadataForMdocPayload(namespaces: MdocNameSpaces, mdocInstance: Mdoc) {
  const attributes: CredentialForDisplay['attributes'] = Object.fromEntries(
    Object.values(namespaces).flatMap((v) => {
      return Object.entries(v).map(([key, value]) => [key, recursivelyMapAttributes(value)])
    })
  )

  // FIXME: Date should be fixed in Mdoc library
  // The problem is that mdocInstance.validityInfo.validFrom and validUntil are already Date objects that contain NaN, not just NaN values.
  // When you call toISOString() on a Date containing NaN, it will throw an error.
  const mdocMetadata: CredentialMetadata = {
    type: mdocInstance.docType,
    holder: mdocInstance.deviceKey
      ? safeCalculateJwkThumbprint(getJwkFromKey(mdocInstance.deviceKey).toJson())
      : undefined,
    issuedAt: mdocInstance.validityInfo.signed.toISOString(),
    validFrom:
      mdocInstance.validityInfo.validFrom instanceof Date &&
      !Number.isNaN(mdocInstance.validityInfo.validFrom.getTime())
        ? mdocInstance.validityInfo.validFrom.toISOString()
        : undefined,
    validUntil:
      mdocInstance.validityInfo.validUntil instanceof Date &&
      !Number.isNaN(mdocInstance.validityInfo.validUntil.getTime())
        ? mdocInstance.validityInfo.validUntil.toISOString()
        : undefined,
  }

  return {
    attributes,
    metadata: mdocMetadata,
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

  const holder = cnf ? (cnf.kid ?? cnf.jwk ? safeCalculateJwkThumbprint(cnf.jwk as JwkJson) : undefined) : undefined
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
      Object.entries(visibleProperties).map(([key, value]) => [key, recursivelyMapAttributes(value)])
    ),
    metadata: credentialMetadata,
  }
}

export function getDisclosedAttributePathArrays(
  payload: object,
  maxDepth: number | undefined = undefined,
  prefix: string[] = []
): string[][] {
  let attributePaths: string[][] = []

  for (const [key, value] of Object.entries(payload)) {
    if (!value) continue

    // TODO: handle arrays
    const newPath = [...prefix, key]
    if (value && typeof value === 'object' && maxDepth !== 0) {
      // If the value is a nested object, recurse
      attributePaths = [
        ...attributePaths,
        ...getDisclosedAttributePathArrays(value, maxDepth !== undefined ? maxDepth - 1 : undefined, newPath),
      ]
    } else {
      // If the value is a primitive or maxDepth is reached, add the key to the list
      attributePaths.push(newPath)
    }
  }

  return attributePaths
}

export function getCredentialForDisplayId(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialForDisplayId {
  if (credentialRecord instanceof SdJwtVcRecord) {
    return `sd-jwt-vc-${credentialRecord.id}`
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    return `w3c-credential-${credentialRecord.id}`
  }
  if (credentialRecord instanceof MdocRecord) {
    return `mdoc-${credentialRecord.id}`
  }

  throw new Error('Unsupported credential record type')
}

export function getCredentialForDisplay(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialForDisplay {
  const credentialCategoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const credentialForDisplayId = getCredentialForDisplayId(credentialRecord)
  const hasRefreshToken = getRefreshCredentialMetadata(credentialRecord) !== null

  if (credentialRecord instanceof SdJwtVcRecord) {
    const sdJwtVc = credentialRecord.credential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
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
      getAttributesForCategory({
        format: ClaimFormat.SdJwtVc,
        credentialCategory: credentialCategoryMetadata?.credentialCategory,
        attributes,
      }) ??
      getAttributesForDocTypeOrVct({
        type: sdJwtVc.payload.vct as string,
        attributes,
      }) ??
      attributes

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
      claimFormat: ClaimFormat.SdJwtVc,
      record: credentialRecord,
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof MdocRecord) {
    const mdocInstance = credentialRecord.credential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const credentialDisplay = getMdocCredentialDisplay(mdocInstance, openId4VcMetadata)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)
    const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(
      mdocInstance.issuerSignedNamespaces,
      mdocInstance
    )
    const customAttributesForDisplay =
      getAttributesForCategory({
        format: ClaimFormat.MsoMdoc,
        credentialCategory: credentialCategoryMetadata?.credentialCategory,
        attributes,
      }) ??
      getAttributesForDocTypeOrVct({
        type: mdocInstance.docType,
        attributes,
      }) ??
      attributes

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
      claimFormat: ClaimFormat.MsoMdoc,
      record: credentialRecord,
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    const credential = JsonTransformer.toJSON(
      credentialRecord.credential.claimFormat === ClaimFormat.JwtVc
        ? credentialRecord.credential.credential
        : credentialRecord.credential.toJson()
    ) as W3cCredentialJson

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }

  throw new Error('Unsupported format')
}

type MappedAttributesReturnType =
  | string
  | number
  | boolean
  | { [key: string]: MappedAttributesReturnType }
  | null
  | undefined
  | Array<MappedAttributesReturnType>
export function recursivelyMapAttributes(value: unknown): MappedAttributesReturnType {
  if (value instanceof Uint8Array) {
    const imageMimeType = detectImageMimeType(value)
    if (imageMimeType) {
      return `data:${imageMimeType};base64,${TypedArrayEncoder.toBase64(value)}`
    }

    // TODO: what to do with a buffer that is not an image?
    return TypedArrayEncoder.toUtf8String(value)
  }
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value

  if (value instanceof Date || value instanceof DateOnly || (typeof value === 'string' && isDateString(value))) {
    return formatDate(value instanceof DateOnly ? value.toISOString() : value)
  }
  if (typeof value === 'string') return value
  if (value instanceof Map) {
    return Object.fromEntries(Array.from(value.entries()).map(([key, value]) => [key, recursivelyMapAttributes(value)]))
  }
  if (Array.isArray(value)) return value.map(recursivelyMapAttributes)

  return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, recursivelyMapAttributes(value)]))
}
