import {
  ClaimFormat,
  DateOnly,
  Hasher,
  JsonTransformer,
  type Kms,
  type Mdoc,
  type MdocNameSpaces,
  MdocRecord,
  SdJwtVcRecord,
  type SdJwtVcTypeMetadata,
  type SingleOrArray,
  TypedArrayEncoder,
  W3cCredentialRecord,
  type W3cJsonCredential,
  W3cV2CredentialRecord,
  type W3cV2JsonCredential,
} from '@credo-ts/core'
import { t } from '@lingui/core/macro'
import { commonMessages, i18n } from '@package/translations'
import { detectImageMimeType, formatDate, getHostNameFromUrl, isDateString, sanitizeString } from '@package/utils'
import { type CredentialCategoryMetadata, getCredentialCategoryMetadata } from './credentialCategoryMetadata'
import type { FormattedSubmissionEntrySatisfiedCredential } from './format/formatPresentation'
import type { FormattedAttribute, FormattedAttributeObject } from './formatAttributes'
import {
  findDisplayByLocale,
  formatAllAttributes,
  mapAttributeName,
  resolveLabelFromClaimsPath,
} from './formatAttributes'
import type { CredentialForDisplayId } from './hooks'
import type { OpenId4VcCredentialMetadata, OpenId4VciCredentialDisplayClaims } from './openid4vc/displayMetadata'
import { getOpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'

export type {
  FormattedAttribute,
  FormattedAttributeArray,
  FormattedAttributeBoolean,
  FormattedAttributeDate,
  FormattedAttributeImage,
  FormattedAttributeNumber,
  FormattedAttributeObject,
  FormattedAttributePrimitive,
  FormattedAttributeString,
} from './formatAttributes'
export {
  findDisplayByLocale,
  formatAllAttributes,
  mapAttributeName,
  resolveLabelFromClaimsPath,
} from './formatAttributes'

const sdJwtVcNonRenderedProperties = ['_sd_alg', '_sd_hash', 'iss', 'vct', 'cnf', 'iat', 'exp', 'nbf', 'status', '_sd']

/**
 * Paths that were requested but couldn't be satisfied.
 */
export function getUnsatisfiedAttributeLabelsForDisplay(
  paths: Array<Array<string | number | null>>,
  claims?: OpenId4VciCredentialDisplayClaims
) {
  const resolvedLabels = paths
    .filter((path) => path.length !== 1 || !sdJwtVcNonRenderedProperties.includes(path[0] as string))
    .map((path) => {
      // Try to resolve from claims metadata first
      const label = resolveLabelFromClaimsPath(path, claims, i18n.locale)
      if (label) return label

      // Fallback to using path
      const relevantPathElement = path.find((p) => typeof p === 'string') ?? path[path.length - 1]
      return mapAttributeName(String(relevantPathElement))
    })

  return Array.from(new Set(resolvedLabels))
}

/**
 * Paths that were requested and we have a matching credential for.
 * This list is used for two purposes:
 *  - rendering attribute names in card preview
 *  - rendering how many attributes (count) will be shared
 */
export function getDisclosedAttributeLabelsForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  const claims = resolveClaimsWithRecordMetadata(credential.credential.record)

  const resolvedLabels = credential.disclosed.paths.map((path) => {
    // Try to resolve from claims metadata first
    const label = resolveLabelFromClaimsPath(path, claims, i18n.locale)
    if (label) return label

    // Fallback to sanitizeString
    // For mdoc we use the attribute name (second element in path)
    if (credential.credential.claimFormat === ClaimFormat.MsoMdoc) {
      return mapAttributeName(String(path[1]))
    }

    // For other formats, use the first path element or the last non-null element
    // const lastPathElement = path[path.length - 1]
    const relevantPathElement = [...path].reverse().find((e) => typeof e === 'string')
    return mapAttributeName(String(relevantPathElement))
  })

  return Array.from(new Set(resolvedLabels))
}

export interface DisplayImage {
  url?: string
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

export function metadataForDisplay(metadata: CredentialMetadata): FormattedAttribute[] {
  const { type, holder, issuedAt, issuer, validFrom, validUntil } = metadata

  const attributes: FormattedAttribute[] = []

  if (type) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.credentialType),
      rawValue: type,
      path: ['type'],
      value: type,
    })
  }

  if (issuer) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.issuer),
      rawValue: issuer,
      path: ['issuer'],
      value: issuer,
    })
  }

  if (holder) {
    attributes.push({
      type: 'string',
      label: t(commonMessages.fields.holder),
      rawValue: holder,
      path: ['holder'],
      value: holder,
    })
  }

  if (issuedAt) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.issued_at),
      rawValue: issuedAt,
      path: ['issuedAt'],
      value: formatDate(new Date(issuedAt)),
    })
  }

  if (validFrom) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.validFrom),
      rawValue: validFrom,
      path: ['validFrom'],
      value: formatDate(new Date(validFrom)),
    })
  }

  if (validUntil) {
    attributes.push({
      type: 'date',
      label: t(commonMessages.fields.expires_at),
      rawValue: validUntil,
      path: ['validUntil'],
      value: formatDate(new Date(validUntil)),
    })
  }

  return attributes
}

export interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay
  /**
   * All attributes with claim path ordering applied.
   * Attributes with claim paths are prioritized but all attributes are included.
   */
  attributes: FormattedAttribute[]
  /**
   * Raw attributes exactly as they appear in the credential.
   * Can be used to directly access data from the credential.
   */
  rawAttributes: Record<string, unknown>
  metadata: CredentialMetadata
  claimFormat:
    | ClaimFormat.SdJwtDc
    | ClaimFormat.SdJwtW3cVc
    | ClaimFormat.JwtW3cVc
    | ClaimFormat.MsoMdoc
    | ClaimFormat.JwtVc
    | ClaimFormat.LdpVc
  record: W3cCredentialRecord | W3cV2CredentialRecord | MdocRecord | SdJwtVcRecord

  category: CredentialCategoryMetadata | null
  hasRefreshToken: boolean
}

function getW3cIssuerDisplay(
  credential: W3cJsonCredential | W3cV2JsonCredential,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (openId4VcMetadata) {
    const openidIssuerDisplay = findDisplayByLocale(openId4VcMetadata.issuer.display, i18n.locale)

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
    const openidCredentialDisplay = findDisplayByLocale(openId4VcMetadata.credential.display, i18n.locale)
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
    name: issuerDisplay.name ?? t(commonMessages.unknown),
  }
}

export function getOpenId4VcIssuerDisplay(
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null
): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (openId4VcMetadata) {
    const openidIssuerDisplay = findDisplayByLocale(openId4VcMetadata.issuer.display, i18n.locale)

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
    const openidCredentialDisplay = findDisplayByLocale(openId4VcMetadata.credential.display, i18n.locale)
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
    name: issuerDisplay.name ?? t(commonMessages.unknown),
  }
}

export function getCredentialDisplayWithDefaults(credentialDisplay?: Partial<CredentialDisplay>): CredentialDisplay {
  return {
    ...credentialDisplay,
    name: credentialDisplay?.name ?? t(commonMessages.credential),
    issuer: {
      ...credentialDisplay?.issuer,
      name: credentialDisplay?.issuer?.name ?? t(commonMessages.unknown),
    },
  }
}

export function getSdJwtTypeMetadataCredentialDisplay(
  sdJwtTypeMetadata: SdJwtVcTypeMetadata
): Omit<CredentialDisplay, 'issuer' | 'name'> & { name?: string } {
  const typeMetadataDisplay = findDisplayByLocale(sdJwtTypeMetadata.display, i18n.locale)

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
  const openidCredentialDisplay = findDisplayByLocale(openId4VcMetadata.credential.display, i18n.locale)

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
  // Type metadata takes precedence.
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

function safeCalculateJwkThumbprint(jwk: Kms.Jwk): string | undefined {
  try {
    const thumbprint = TypedArrayEncoder.toBase64URL(
      Hasher.hash(
        JSON.stringify({ k: jwk.k, e: jwk.e, crv: jwk.crv, kty: jwk.kty, n: jwk.n, x: jwk.x, y: jwk.y }),
        'sha-256'
      )
    )
    return `urn:ietf:params:oauth:jwk-thumbprint:sha-256:${thumbprint}`
  } catch (_e) {
    return undefined
  }
}
export function getAttributesAndMetadataForMdocPayload(namespaces: MdocNameSpaces, mdocInstance: Mdoc) {
  const attributes = Object.fromEntries(
    Object.entries(namespaces).map(([namespace, v]) => [
      namespace,
      Object.fromEntries(Object.entries(v).map(([key, value]) => [key, recursivelyMapAttributes(value)])),
    ])
  )

  // FIXME: Date should be fixed in Mdoc library
  // The problem is that mdocInstance.validityInfo.validFrom and validUntil are already Date objects that contain NaN, not just NaN values.
  // When you call toISOString() on a Date containing NaN, it will throw an error.
  const mdocMetadata: CredentialMetadata = {
    type: mdocInstance.docType,
    holder: mdocInstance.deviceKey ? safeCalculateJwkThumbprint(mdocInstance.deviceKey.toJson()) : undefined,
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
    attributes: attributes as CredentialForDisplay['rawAttributes'],
    attributesWithoutNamespace: Object.fromEntries(
      Object.values(attributes).flatMap((v) => Object.entries(v))
    ) as CredentialForDisplay['rawAttributes'],
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

export function resolveClaimsWithRecordMetadata(
  record: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
) {
  const openId4VcMetadata = getOpenId4VcCredentialMetadata(record)

  const claims =
    record instanceof SdJwtVcRecord
      ? (record.typeMetadata?.claims ?? openId4VcMetadata?.credential.claims)
      : openId4VcMetadata?.credential.claims

  return claims
}

/**
 * Formats disclosed attributes for display using claims metadata from the credential record.
 * Extracts claims from SD-JWT type metadata or OID4VCI credential metadata.
 */
export function formatAttributesWithRecordMetadata(
  payload: Record<string, unknown>,
  record: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
): FormattedAttribute[] {
  const claims = resolveClaimsWithRecordMetadata(record)

  const formattedAttributes = formatAllAttributes(payload, claims, i18n.locale)

  // Mdoc has top-level namespaces, we don't want to render these as attributes
  if (record instanceof MdocRecord) {
    return formattedAttributes.flatMap((item) => (item as FormattedAttributeObject).value)
  }

  return formattedAttributes
}

export function getCredentialForDisplayId(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialForDisplayId {
  if (credentialRecord instanceof SdJwtVcRecord) {
    return `sd-jwt-vc-${credentialRecord.id}`
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    return `w3c-credential-${credentialRecord.id}`
  }
  if (credentialRecord instanceof W3cV2CredentialRecord) {
    return `w3c-v2-credential-${credentialRecord.id}`
  }
  if (credentialRecord instanceof MdocRecord) {
    return `mdoc-${credentialRecord.id}`
  }

  throw new Error('Unsupported credential record type')
}

export function getCredentialForDisplay(
  credentialRecord: W3cCredentialRecord | W3cV2CredentialRecord | SdJwtVcRecord | MdocRecord
): CredentialForDisplay {
  const credentialCategoryMetadata = getCredentialCategoryMetadata(credentialRecord)
  const credentialForDisplayId = getCredentialForDisplayId(credentialRecord)
  const hasRefreshToken = getRefreshCredentialMetadata(credentialRecord) !== null

  if (credentialRecord instanceof SdJwtVcRecord) {
    const sdJwtVc = credentialRecord.firstCredential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const sdJwtTypeMetadata = credentialRecord.typeMetadata
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

    const credentialDisplay = getSdJwtCredentialDisplay(sdJwtVc.prettyClaims, openId4VcMetadata, sdJwtTypeMetadata)
    const { attributes, metadata } = getAttributesAndMetadataForSdJwtPayload(sdJwtVc.prettyClaims)

    // Format displayed attributes (only those in claim metadata)
    const formattedAttributes = formatAttributesWithRecordMetadata(attributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: attributes,
      metadata,
      claimFormat: ClaimFormat.SdJwtDc,
      record: credentialRecord,
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof MdocRecord) {
    const mdocInstance = credentialRecord.firstCredential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const credentialDisplay = getMdocCredentialDisplay(mdocInstance, openId4VcMetadata)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)

    const { attributes, metadata } = getAttributesAndMetadataForMdocPayload(
      mdocInstance.issuerSignedNamespaces,
      mdocInstance
    )

    // Format attributes
    // And then remove the top-layer, as that is the namespace
    const formattedAttributes = formatAttributesWithRecordMetadata(attributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: attributes,
      metadata,
      claimFormat: ClaimFormat.MsoMdoc,
      record: credentialRecord,
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof W3cCredentialRecord) {
    const firstCredential = credentialRecord.firstCredential

    const credential = JsonTransformer.toJSON(
      firstCredential.claimFormat === ClaimFormat.JwtVc ? firstCredential.credential : firstCredential.toJson()
    ) as W3cJsonCredential | W3cV2JsonCredential

    // biome-ignore lint/suspicious/noExplicitAny: no explanation
    const proof = (credential as any).proof as SingleOrArray<{
      type: string
      cryptosuite?: string
      verificationMethod?: string
    }>
    const firstProof = Array.isArray(proof) ? proof[0] : proof
    const isAnonCreds = firstProof.cryptosuite === 'anoncreds-2023'

    let type = firstCredential.type[firstCredential.type.length - 1]
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

    // Format attributes
    const formattedAttributes = formatAttributesWithRecordMetadata(credentialAttributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,
      rawAttributes: credentialAttributes,
      metadata: {
        holder: firstCredential.credentialSubjectIds[0],
        issuer: firstCredential.issuerId,
        type,
        issuedAt: new Date(firstCredential.issuanceDate).toISOString(),
        validUntil: firstCredential.expirationDate ? new Date(firstCredential.expirationDate).toISOString() : undefined,
        validFrom: new Date(firstCredential.issuanceDate).toISOString(),
      },
      claimFormat: firstCredential.claimFormat,
      record: credentialRecord,
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }

  if (credentialRecord instanceof W3cV2CredentialRecord) {
    const resolvedCredential = credentialRecord.firstCredential.resolvedCredential
    const credential = resolvedCredential.toJSON()

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const issuerDisplay = getW3cIssuerDisplay(credential, openId4VcMetadata)
    const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

    // FIXME: support credential with multiple subjects
    const credentialAttributes = Array.isArray(credential.credentialSubject)
      ? (credential.credentialSubject[0] ?? {})
      : credential.credentialSubject

    // Format attributes
    const formattedAttributes = formatAttributesWithRecordMetadata(credentialAttributes, credentialRecord)

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      attributes: formattedAttributes,

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
