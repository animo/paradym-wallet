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
import type { MessageDescriptor } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { commonMessages, i18n } from '@package/translations'
import { detectImageMimeType, formatDate, getHostNameFromUrl, isDateString, sanitizeString } from '@package/utils'
import { type CredentialCategoryMetadata, getCredentialCategoryMetadata } from './credentialCategoryMetadata'
import { getAttributesForCategory } from './display/category'
import { getAttributesForDocTypeOrVct } from './display/docTypeOrVct'
import type { FormattedSubmissionEntrySatisfiedCredential } from './format/formatPresentation'
import type { CredentialForDisplayId } from './hooks'
import type { OpenId4VcCredentialMetadata, OpenId4VciCredentialDisplayClaims } from './openid4vc/displayMetadata'
import { getOpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'

/**
 * Paths that were requested but couldn't be satisfied.
 * Maybe belongs in agent, but adding here because the `nonRenderedPaths` is
 * very intertwined with our rendering logic
 */
export function getUnsatisfiedAttributePathsForDisplay(
  paths: Array<Array<string | number | null>>,
  claims?: OpenId4VciCredentialDisplayClaims
) {
  const nonRenderedPaths = ['iss', 'vct']

  const resolvedLabels = paths
    .filter((path) => !path.some((p) => nonRenderedPaths.includes(p as string)))
    .map((path) => {
      // Try to resolve from claims metadata first
      const label = resolveLabelFromClaimsPath(path, claims, i18n.locale)
      if (label) return label

      // Fallback to sanitizeString
      // Use the first path element or the last non-null element
      const relevantPathElement = path.find((p) => typeof p === 'string') ?? path[path.length - 1]
      return sanitizeString(String(relevantPathElement))
    })

  return Array.from(new Set(resolvedLabels))
}

/**
 * Paths that were requested and we have a matching credential for.
 * This list is used for two purposes:
 *  - rendering attribute names in card preview
 *  - rendering how many attributes (count) will be shared
 */
export function getDisclosedAttributeNamesForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credential.credential.record)
  const claims = openId4VcMetadata?.credential.claims

  const resolvedLabels = credential.disclosed.paths.map((path) => {
    // Try to resolve from claims metadata first
    const label = resolveLabelFromClaimsPath(path, claims, i18n.locale)
    if (label) return label

    // Fallback to sanitizeString
    // For mdoc we use the attribute name (second element in path)
    if (credential.credential.claimFormat === ClaimFormat.MsoMdoc) {
      return sanitizeString(String(path[1]))
    }

    // For other formats, use the first path element or the last non-null element
    const relevantPathElement = path.find((p) => typeof p === 'string') ?? path[path.length - 1]
    return sanitizeString(String(relevantPathElement))
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

export function metadataForDisplay(metadata: CredentialMetadata) {
  const { type, holder, issuedAt, issuer, validFrom, validUntil } = metadata

  return {
    [t(commonMessages.fields.credentialType)]: type,
    [t(commonMessages.fields.issuer)]: issuer,
    [t(commonMessages.fields.holder)]: holder,
    [t(commonMessages.fields.issued_at)]: issuedAt ? formatDate(new Date(issuedAt)) : undefined,
    [t(commonMessages.fields.validFrom)]: validFrom ? formatDate(new Date(validFrom)) : undefined,
    [t(commonMessages.fields.expires_at)]: validUntil ? formatDate(new Date(validUntil)) : undefined,
  }
}

export interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay
  attributes: Record<string, unknown>
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

// TODO: move to a more common place, make it less brittle
const attributeNameMapping: Record<string, MessageDescriptor> = {
  age_equal_or_over: commonMessages.fields.age_over,
  age_birth_year: commonMessages.fields.birth_year,
  age_in_years: commonMessages.fields.age,
  street_address: commonMessages.fields.street,
  resident_street: commonMessages.fields.street,
  resident_city: commonMessages.fields.city,
  resident_country: commonMessages.fields.country,
  resident_postal_code: commonMessages.fields.postal_code,
  birth_date: commonMessages.fields.date_of_birth,
  birthdate: commonMessages.fields.date_of_birth,
  expiry_date: commonMessages.fields.expires_at,
  issue_date: commonMessages.fields.issued_at,
  issuance_date: commonMessages.fields.issued_at,
  ...commonMessages.fields,
  ...commonMessages.credentials.mdl,
}

export const mapAttributeName = (key: string) => {
  const messageDescriptor = attributeNameMapping[key]
  if (messageDescriptor) return i18n.t(messageDescriptor)

  if (key.startsWith('age_over_')) {
    return `${i18n.t(commonMessages.fields.age_over)} ${key.replace('age_over_', '')}`
  }

  return sanitizeString(key)
}

/**
 * Finds the best matching display value for the current locale from an array of display objects.
 * Handles locale matching between IETF BCP 47 language tags (with region) and simple language codes (without region).
 *
 * @param display - Array of display objects with locale and name properties
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns The best matching display object or undefined
 */
function findDisplayByLocale<Display extends { locale?: string; name?: string }>(
  display?: Display[],
  currentLocale?: string
): Display | undefined {
  if (!display || display.length === 0) return undefined

  // If we have a current locale, try to match it (ignoring region codes)
  if (currentLocale) {
    // Try exact match first (e.g., 'en' matches 'en' or 'en-US' matches 'en-US')
    const item = display.find((d) => d.locale === currentLocale || d.locale?.startsWith(`${currentLocale}-`))
    if (item) return item
  }

  // Fallback to English
  const englishItem = display.find((d) => d.locale?.startsWith('en-') || d.locale === 'en')
  if (englishItem) return englishItem

  // Fallback to first entry without locale
  const noLocaleItem = display.find((d) => !d.locale)
  if (noLocaleItem) return noLocaleItem

  // Last resort: first entry
  return display[0]
}

/**
 * Resolves a claims path pointer to select value(s) from credential attributes.
 * Follows the OpenID4VC specification for claims path pointers.
 *
 * @param data - The credential data to query
 * @param path - Array of path components (strings for keys, numbers for array indices, null for all array elements)
 * @returns Array of selected values, or empty array if path doesn't match
 */
function resolveClaimsPath(data: unknown, path: Array<string | number | null>): unknown[] {
  if (path.length === 0) {
    return [data]
  }

  const [currentComponent, ...remainingPath] = path
  let selectedElements: unknown[] = []

  // Handle string path component (object key)
  if (typeof currentComponent === 'string') {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const value = (data as Record<string, unknown>)[currentComponent]
      if (value !== undefined) {
        selectedElements = [value]
      }
    }
  }
  // Handle null path component (select all array elements)
  else if (currentComponent === null) {
    if (Array.isArray(data)) {
      selectedElements = data
    }
  }
  // Handle number path component (array index)
  else if (typeof currentComponent === 'number') {
    if (currentComponent < 0) {
      // Negative integers are not supported
      return []
    }
    if (Array.isArray(data) && currentComponent < data.length) {
      selectedElements = [data[currentComponent]]
    }
  }

  // If no elements were selected, return empty array
  if (selectedElements.length === 0) {
    return []
  }

  // If this was the last path component, return the selected elements
  if (remainingPath.length === 0) {
    return selectedElements
  }

  // Recursively process remaining path components for each selected element
  const results: unknown[] = []
  for (const element of selectedElements) {
    const nestedResults = resolveClaimsPath(element, remainingPath)
    results.push(...nestedResults)
  }

  return results
}

/**
 * Resolves a label for a given path using claims metadata.
 * Tries to match the exact path first, then falls back to parent paths.
 *
 * @param path - The path to resolve (array of strings, numbers, or null)
 * @param claims - The claims metadata from OpenID4VC credential metadata
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns The localized label or null if no match found
 */
function resolveLabelFromClaimsPath(
  path: Array<string | number | null>,
  claims?: OpenId4VciCredentialDisplayClaims,
  currentLocale?: string
): string | null {
  if (!claims || claims.length === 0) {
    return null
  }

  // Helper to check if two paths match
  const pathsMatch = (claimPath: Array<string | number | null>, targetPath: Array<string | number | null>): boolean => {
    if (claimPath.length !== targetPath.length) return false
    return claimPath.every((segment, i) => segment === targetPath[i])
  }

  // Try exact match first
  for (const claim of claims) {
    if (!claim.path || claim.path.length === 0) continue
    if (pathsMatch(claim.path, path)) {
      const displayItem = findDisplayByLocale(claim.display, currentLocale)
      if (displayItem?.name) return displayItem.name
    }
  }

  // Try to find parent path matches (from most specific to least specific)
  // e.g., for path ['driving_privileges', 0], try ['driving_privileges']
  for (let length = path.length - 1; length > 0; length--) {
    const parentPath = path.slice(0, length)
    for (const claim of claims) {
      if (!claim.path || claim.path.length === 0) continue
      if (pathsMatch(claim.path, parentPath)) {
        const displayItem = findDisplayByLocale(claim.display, currentLocale)
        if (displayItem?.name) return displayItem.name
      }
    }
  }

  return null
}

/**
 * Applies claims metadata to credential attributes.
 * Orders attributes according to the claims array and uses localized labels.
 * Supports nested paths for objects and arrays following OpenID4VC specification.
 *
 * @param rawAttributes - The raw credential attributes as a flat key-value object
 * @param claims - The claims metadata from OpenID4VC credential metadata
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns Ordered attributes with localized labels, or null if no claims metadata is available
 */
export function applyClaimsMetadata(
  rawAttributes: Record<string, unknown>,
  claims?: OpenId4VciCredentialDisplayClaims,
  currentLocale?: string
): Record<string, unknown> | null {
  if (!claims || claims.length === 0) {
    return null
  }

  const orderedAttributes: Record<string, unknown> = {}

  // Process claims in order
  for (const claim of claims) {
    if (!claim.path || claim.path.length === 0) continue

    // Resolve the path to get the value(s)
    const selectedValues = resolveClaimsPath(rawAttributes, claim.path)

    // Skip if path didn't match anything
    if (selectedValues.length === 0) continue

    // Get the localized label for this claim
    const displayItem = findDisplayByLocale(claim.display, currentLocale)
    const label = displayItem?.name ?? sanitizeString(String(claim.path[claim.path.length - 1]))

    // If we selected multiple values (e.g., from array), store as array
    // If we selected a single value, store it directly
    if (selectedValues.length === 1) {
      orderedAttributes[label] = selectedValues[0]
    } else {
      orderedAttributes[label] = selectedValues
    }
  }

  // If we didn't process any attributes, return null
  if (Object.keys(orderedAttributes).length === 0) {
    return null
  }

  return orderedAttributes
}

function _applyAttributeKeyDisplay(attribute: object): object {
  if (Array.isArray(attribute)) {
    return attribute.map((innerAttribute) =>
      innerAttribute && typeof innerAttribute === 'object' ? _applyAttributeKeyDisplay(innerAttribute) : innerAttribute
    )
  }

  if (typeof attribute === 'object') {
    return Object.fromEntries(
      Object.entries(attribute).map(([key, value]) => [
        key,
        value && typeof value === 'object' ? _applyAttributeKeyDisplay(value) : value,
      ])
    )
  }

  return attribute
}

export function applyAttributeKeyDisplay(attributes: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue

    const name = mapAttributeName(key)
    mapped[name] = typeof value === 'object' ? _applyAttributeKeyDisplay(value) : value
  }

  return mapped
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
      Object.entries(v).map(([key, value]) => [key, recursivelyMapAttributes(value)]),
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
    attributes: attributes as CredentialForDisplay['attributes'],
    attributesWithoutNamespace: Object.fromEntries(
      Object.values(attributes).flatMap((v) => Object.entries(v))
    ) as CredentialForDisplay['attributes'],
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

    // Order of precedence for attribute display:
    // 1. Custom attributes for PID and MDL using category
    // 2. Attributes from OID4VC Metadata claims (with ordering and localized labels)
    // 3. Attributes from SD JWT Type Metadata
    // 4. Raw attributes

    const customAttributesForDisplay =
      getAttributesForCategory({
        format: ClaimFormat.SdJwtDc,
        credentialCategory: credentialCategoryMetadata?.credentialCategory,
        attributes,
      }) ??
      getAttributesForDocTypeOrVct({
        type: sdJwtVc.payload.vct as string,
        attributes,
      }) ??
      applyClaimsMetadata(attributes, openId4VcMetadata?.credential.claims, i18n.locale) ??
      applyAttributeKeyDisplay(attributes)

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
      category: credentialCategoryMetadata,
      hasRefreshToken,
    }
  }
  if (credentialRecord instanceof MdocRecord) {
    const mdocInstance = credentialRecord.firstCredential

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const credentialDisplay = getMdocCredentialDisplay(mdocInstance, openId4VcMetadata)
    const issuerDisplay = getOpenId4VcIssuerDisplay(openId4VcMetadata)
    const { attributes, attributesWithoutNamespace, metadata } = getAttributesAndMetadataForMdocPayload(
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
      applyClaimsMetadata(attributes, openId4VcMetadata?.credential.claims, i18n.locale) ??
      applyAttributeKeyDisplay(attributesWithoutNamespace)

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
