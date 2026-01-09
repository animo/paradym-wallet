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
  type SdJwtVcTypeMetadataClaim,
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
import type { FormattedSubmissionEntrySatisfiedCredential } from './format/formatPresentation'
import type { CredentialForDisplayId } from './hooks'
import type { OpenId4VcCredentialMetadata, OpenId4VciCredentialDisplayClaims } from './openid4vc/displayMetadata'
import { getOpenId4VcCredentialMetadata } from './openid4vc/displayMetadata'
import { getRefreshCredentialMetadata } from './openid4vc/refreshMetadata'

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
  const openId4VcMetadata = getOpenId4VcCredentialMetadata(credential.credential.record)
  const sdJwtVcTypeMetadata =
    credential.credential.record instanceof SdJwtVcRecord ? credential.credential.record.typeMetadata : undefined

  const claims = sdJwtVcTypeMetadata?.claims ?? openId4VcMetadata?.credential.claims

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

/**
 * Base interface for all formatted credential attribute types
 */
interface BaseFormattedAttribute {
  /** Translated label (from claim metadata or mapAttributeName) */
  label?: string
  /** Description from claim metadata if present */
  description?: string
  /** The raw value before any formatting */
  rawValue: unknown
  /** The path to this attribute in the credential */
  path: Array<string | number | null>
}

export type FormattedAttributeString = BaseFormattedAttribute & {
  type: 'string'
  value: string
}

export type FormattedAttributeNumber = BaseFormattedAttribute & {
  type: 'number'
  value: number
}

export type FormattedAttributeBoolean = BaseFormattedAttribute & {
  type: 'boolean'
  value: boolean
}

export type FormattedAttributeDate = BaseFormattedAttribute & {
  type: 'date'
  value: string
}

export type FormattedAttributeImage = BaseFormattedAttribute & {
  type: 'image'
  value: string
}

export type FormattedAttributeArray = BaseFormattedAttribute & {
  type: 'array'
  value: FormattedAttribute[]
}

export type FormattedAttributeObject = BaseFormattedAttribute & {
  type: 'object'
  value: FormattedAttribute[]
}

export type FormattedAttribute =
  | FormattedAttributeString
  | FormattedAttributeNumber
  | FormattedAttributeBoolean
  | FormattedAttributeDate
  | FormattedAttributeImage
  | FormattedAttributeArray
  | FormattedAttributeObject

export interface CredentialForDisplay {
  id: CredentialForDisplayId
  createdAt: Date
  display: CredentialDisplay
  /**
   * Displayed attributes based on claim metadata.
   * If claim metadata exists, only includes attributes listed in the metadata.
   * If no claim metadata, includes all attributes (same as allAttributes).
   */
  displayedAttributes: FormattedAttribute[]
  /**
   * All attributes with claim path ordering applied.
   * Attributes with claim paths are prioritized but all attributes are included.
   */
  allAttributes: FormattedAttribute[]
  /**
   * Raw attributes exactly as they appear in the credential.
   * Can be used to directly access data from the credential.
   */
  rawAttributes: Record<string, unknown>
  /**
   * Indicates whether displayedAttributes and allAttributes are different.
   * If true, there is custom display logic (claim metadata or custom rendering).
   * Used to determine if "Show all attributes" option should be shown.
   */
  hasCustomDisplay: boolean
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

type SdJwtVcTypeMetadataClaimDisplayEntry = NonNullable<SdJwtVcTypeMetadataClaim['display']>[number]
type OpenId4VciCredentialClaimDisplayEntry = NonNullable<
  NonNullable<OpenId4VciCredentialDisplayClaims>[number]['display']
>[number]

/**
 * Finds the best matching display value for the current locale from an array of display objects.
 * Handles locale matching between IETF BCP 47 language tags (with region) and simple language codes (without region).
 *
 * @param display - Array of display objects with locale and name properties
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns The best matching display object or undefined
 */
function findDisplayByLocale<Display extends { locale?: string }[]>(
  display?: Display,
  currentLocale?: string
): Display[number] | undefined {
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

function extractLabelFromDisplay(
  display?: SdJwtVcTypeMetadataClaimDisplayEntry | OpenId4VciCredentialClaimDisplayEntry
) {
  if (!display) return null

  // OpenID4VCI
  if ('name' in display && typeof display.name === 'string') return display.name

  // SD-JWT VC Type Metadata
  if ('label' in display && typeof display.label === 'string') return display.label

  return null
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
 * The claims metadata can be either OpenID4VCI or SD-JWT VC claims metadata.
 *
 * @param path - The path to resolve (array of strings, numbers, or null)
 * @param claims - The claims metadata from OpenID4VC credential metadata
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns The localized label or null if no match found
 */
function resolveLabelFromClaimsPath(
  path: Array<string | number | null>,
  claims?: OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[],
  currentLocale?: string
): string | null {
  if (!claims || claims.length === 0) {
    return null
  }

  // Helper to check if two paths match exactly (no wildcards)
  const pathsMatchExact = (
    claimPath: Array<string | number | null>,
    targetPath: Array<string | number | null>
  ): boolean => {
    if (claimPath.length !== targetPath.length) return false
    return claimPath.every((segment, i) => segment === targetPath[i])
  }

  // Helper to check if two paths match with wildcard support
  // null in claimPath acts as a wildcard that matches any value in targetPath
  const pathsMatchWithWildcard = (
    claimPath: Array<string | number | null>,
    targetPath: Array<string | number | null>
  ): boolean => {
    if (claimPath.length !== targetPath.length) return false
    return claimPath.every((segment, i) => segment === null || segment === targetPath[i])
  }

  // Try to find exact match first, but store wildcard match as fallback
  let wildcardMatch: string | null = null
  for (const claim of claims) {
    if (!claim.path || claim.path.length === 0) continue

    // Check for exact match first
    if (pathsMatchExact(claim.path, path)) {
      const displayItem = findDisplayByLocale(claim.display, currentLocale)

      const label = extractLabelFromDisplay(displayItem)
      if (label) return label
    }

    // Store wildcard match as fallback (only if we haven't found one yet)
    if (!wildcardMatch && pathsMatchWithWildcard(claim.path, path)) {
      const displayItem = findDisplayByLocale(claim.display, currentLocale)
      wildcardMatch = extractLabelFromDisplay(displayItem)
    }
  }

  // If we found a wildcard match but no exact match, return the wildcard match
  if (wildcardMatch) {
    return wildcardMatch
  }

  // Try to find parent path matches (from most specific to least specific)
  // e.g., for path ['driving_privileges', 0], try ['driving_privileges']
  for (let length = path.length - 1; length > 0; length--) {
    const parentPath = path.slice(0, length)
    for (const claim of claims) {
      if (!claim.path || claim.path.length === 0) continue
      if (pathsMatchWithWildcard(claim.path, parentPath)) {
        const displayItem = findDisplayByLocale(claim.display, currentLocale)

        const label = extractLabelFromDisplay(displayItem)
        if (label) return label
      }
    }
  }

  return null
}

/**
 * Checks if a string is likely to be a date
 */
function isLikelyDate(value: string): boolean {
  // Check for common date patterns
  const datePatterns = [
    // Match "Month Day, Year" format
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i,
    // Match "Month Day, Year at HH:MM" format
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}/i,
    // ISO date format
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
    // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,
  ]

  return datePatterns.some((pattern) => pattern.test(value))
}

/**
 * Formats a single value into a FormattedAttribute with type detection
 */
export function formatAttributeValue(
  key: string | number,
  value: unknown,
  path: Array<string | number | null>,
  label: string,
  description?: string
): FormattedAttribute {
  const rawValue = value

  // Handle Uint8Array (images)
  if (value instanceof Uint8Array) {
    const imageMimeType = detectImageMimeType(value)
    if (imageMimeType) {
      return {
        type: 'image',
        label,
        description,
        rawValue,
        path,
        value: `data:${imageMimeType};base64,${TypedArrayEncoder.toBase64(value)}`,
      }
    }
    // Non-image buffer becomes string
    return {
      type: 'string',
      label,
      description,
      rawValue,
      path,
      value: TypedArrayEncoder.toUtf8String(value),
    }
  }

  // Handle dates
  if (value instanceof Date || value instanceof DateOnly || (typeof value === 'string' && isDateString(value))) {
    return {
      type: 'date',
      label,
      description,
      rawValue,
      path,
      value: formatDate(value instanceof DateOnly ? value.toISOString() : value),
    }
  }

  // Handle primitives
  if (typeof value === 'string') {
    // Check if it's an image data URL
    if (value.startsWith('data:image/')) {
      return {
        type: 'image',
        label,
        description,
        rawValue,
        path,
        value,
      }
    }

    // Check if it's a date string
    if (isLikelyDate(value)) {
      return {
        type: 'date',
        label,
        description,
        rawValue,
        path,
        value,
      }
    }

    return {
      type: 'string',
      label,
      description,
      rawValue,
      path,
      value,
    }
  }

  if (typeof value === 'number') {
    return {
      type: 'number',
      label,
      description,
      rawValue,
      path,
      value,
    }
  }

  if (typeof value === 'boolean') {
    return {
      type: 'boolean',
      label,
      description,
      rawValue,
      path,
      value,
    }
  }

  if (value === null || value === undefined) {
    return {
      type: 'string',
      label,
      description,
      rawValue,
      path,
      value: '',
    }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    // If array has only one item, process it directly
    if (value.length === 1) {
      return formatAttributeValue(key, value[0], path, `${label} → 1`, description)
    }

    const formattedArray = value.map((item, index) => {
      const itemPath = [...path, index]
      const itemLabel = mapAttributeName(String(index))
      const formatted = formatAttributeValue(index, item, itemPath, itemLabel)

      // Use arrow syntax instead of bracket notation
      return {
        ...formatted,
        // Empty as it will shown as a separate page
        label: '',
      }
    })

    return {
      type: 'array',
      label,
      description,
      rawValue,
      path,
      value: formattedArray,
    }
  }

  // Handle Maps
  if (value instanceof Map) {
    const obj = Object.fromEntries(value)
    return formatAttributeValue(key, obj, path, label, description)
  }

  // Handle objects
  if (typeof value === 'object') {
    // Special case for image objects
    if ('type' in value && value.type === 'Image' && 'id' in value && typeof value.id === 'string') {
      return { type: 'image', value: value.id as string, label, rawValue: value, path, description }
    }

    const formattedEntries: FormattedAttribute[] = []
    const objectEntries = Object.entries(value)

    // If object has only one entry, shortcut with arrow syntax
    if (objectEntries.length === 1) {
      const [objKey, objValue] = objectEntries[0]
      if (objValue !== undefined && objValue !== null) {
        const objPath = [...path, objKey]
        const objLabel = mapAttributeName(objKey)
        const formatted = formatAttributeValue(objKey, objValue, objPath, objLabel)

        return {
          ...formatted,
          label: typeof key === 'number' ? formatted.label : `${label} → ${formatted.label}`,
        }
      }
    }

    for (const [objKey, objValue] of objectEntries) {
      if (objValue === undefined || objValue === null) continue
      if (typeof objValue === 'object' && objValue !== null && Object.keys(objValue).length === 0) continue

      const objPath = [...path, objKey]
      const objLabel = mapAttributeName(objKey)
      formattedEntries.push(formatAttributeValue(objKey, objValue, objPath, objLabel))
    }

    return {
      type: 'object',
      label,
      description,
      rawValue,
      path,
      value: formattedEntries,
    }
  }

  // Fallback
  return {
    type: 'string',
    label,
    description,
    rawValue,
    path,
    value: String(value),
  }
}

/**
 * Converts a Record<string, unknown> to FormattedAttribute[]
 * Useful for converting disclosed payloads or raw attributes to the new format
 */
export function formatAttributes(attributes: Record<string, unknown>): FormattedAttribute[] {
  const formatted: FormattedAttribute[] = []
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue

    const label = mapAttributeName(key)
    const path = [key]
    formatted.push(formatAttributeValue(key, value, path, label))
  }
  return formatted
}

/**
 * Extracts description from claim metadata display
 */
function extractDescriptionFromDisplay(
  display?: SdJwtVcTypeMetadataClaimDisplayEntry | OpenId4VciCredentialClaimDisplayEntry
): string | undefined {
  if (!display) return undefined

  // OpenID4VCI doesn't have description in display, only SD-JWT VC has it
  // SD-JWT VC Type Metadata
  if ('description' in display && typeof display.description === 'string') return display.description

  return undefined
}

/**
 * Formats attributes according to claim metadata paths.
 * Returns only attributes that are specified in the claims metadata.
 *
 * @param rawAttributes - The raw credential attributes
 * @param claims - The claims metadata from OpenID4VC credential metadata
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns Array of formatted attributes matching claim paths, or null if no claims metadata
 */
function formatDisplayedAttributes(
  rawAttributes: Record<string, unknown>,
  claims?: OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[],
  currentLocale?: string
): FormattedAttribute[] | null {
  if (!claims || claims.length === 0) {
    return null
  }

  const formattedAttributes: FormattedAttribute[] = []

  // Process claims in order
  for (const claim of claims) {
    if (!claim.path || claim.path.length === 0) continue

    // Resolve the path to get the value(s)
    const selectedValues = resolveClaimsPath(rawAttributes, claim.path)

    // Skip if path didn't match anything
    if (selectedValues.length === 0) continue

    // Get the localized label and description for this claim
    const displayItem = findDisplayByLocale(claim.display, currentLocale)

    let label = sanitizeString(String(claim.path[claim.path.length - 1]))
    // OID4VC-TS
    if (displayItem && 'name' in displayItem && typeof displayItem.name === 'string') label = displayItem.name
    // SD-JWT VC
    if (displayItem && 'label' in displayItem && typeof displayItem.label === 'string') label = displayItem.label

    const description = extractDescriptionFromDisplay(displayItem)

    // If we selected multiple values (e.g., from array with null in path), create array attribute
    if (selectedValues.length > 1) {
      const formattedArray = selectedValues.map((val, index) => {
        // Replace null with the actual index to create the real path
        const pathArray: Array<string | number> = claim.path.map((p) => (p === null ? index : (p as string | number)))
        const itemLabel = mapAttributeName(String(index))
        return formatAttributeValue(index, val, pathArray, itemLabel)
      })

      // Create base path without the null (for the array container)
      const basePath: Array<string | number> = []
      for (let i = 0; i < claim.path.length; i++) {
        if (claim.path[i] === null) break
        basePath.push(claim.path[i] as string | number)
      }

      formattedAttributes.push({
        type: 'array',
        label,
        description,
        rawValue: selectedValues,
        path: basePath,
        value: formattedArray,
      })
    } else {
      // Single value - convert path by removing null (shouldn't happen if length is 1, but handle it)
      const pathArray = claim.path.filter((p): p is string | number => p !== null)
      const key = claim.path[claim.path.length - 1]
      const formatted = formatAttributeValue(key ?? 0, selectedValues[0], pathArray, label, description)
      formattedAttributes.push(formatted)
    }
  }

  if (formattedAttributes.length === 0) {
    return null
  }

  return formattedAttributes
}

/**
 * Formats all attributes with claim path ordering applied.
 * Attributes with claim paths are prioritized but all attributes are included.
 *
 * @param rawAttributes - The raw credential attributes
 * @param claims - The claims metadata from OpenID4VC credential metadata
 * @param currentLocale - Current app locale (e.g., 'en', 'nl', 'de')
 * @returns Array of all formatted attributes with ordering
 */
function formatAllAttributes(
  rawAttributes: Record<string, unknown>,
  claims?: OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[],
  currentLocale?: string
): FormattedAttribute[] {
  const formattedAttributes: FormattedAttribute[] = []
  const processedPaths = new Set<string>()

  // First, process attributes that have claim metadata (to establish ordering)
  if (claims && claims.length > 0) {
    for (const claim of claims) {
      if (!claim.path || claim.path.length === 0) continue

      // Resolve the path to get the value(s)
      const selectedValues = resolveClaimsPath(rawAttributes, claim.path)

      // Skip if path didn't match anything
      if (selectedValues.length === 0) continue

      // Get the localized label and description for this claim
      const displayItem = findDisplayByLocale(claim.display, currentLocale)

      const label = extractLabelFromDisplay(displayItem) ?? mapAttributeName(String(claim.path[claim.path.length - 1]))
      const description = extractDescriptionFromDisplay(displayItem)

      // If we selected multiple values (e.g., from array with null in path), create array attribute
      if (selectedValues.length > 1) {
        // Mark each actual path as processed (with null replaced by actual index)
        for (let index = 0; index < selectedValues.length; index++) {
          const actualPath: Array<string | number> = claim.path.map((p) =>
            p === null ? index : (p as string | number)
          )
          processedPaths.add(actualPath.join('.'))
        }

        const formattedArray = selectedValues.map((val, index) => {
          // Replace null with the actual index to create the real path
          const pathArray: Array<string | number> = claim.path.map((p) => (p === null ? index : (p as string | number)))
          const itemLabel = mapAttributeName(String(index))
          return formatAttributeValue(index, val, pathArray, itemLabel)
        })

        // Create base path without the null (for the array container)
        const basePath: Array<string | number> = []
        for (let i = 0; i < claim.path.length; i++) {
          if (claim.path[i] === null) break
          basePath.push(claim.path[i] as string | number)
        }

        formattedAttributes.push({
          type: 'array',
          label,
          description,
          rawValue: selectedValues,
          path: basePath,
          value: formattedArray,
        })
      } else {
        // Single value - convert path by removing null (shouldn't happen if length is 1, but handle it)
        const pathArray = claim.path.filter((p): p is string | number => p !== null) as Array<string | number>

        // Mark this path as processed
        processedPaths.add(pathArray.join('.'))

        const key = claim.path[claim.path.length - 1]
        const formatted = formatAttributeValue(key ?? 0, selectedValues[0], pathArray, label, description)
        formattedAttributes.push(formatted)
      }
    }
  }

  // Helper function to recursively process remaining attributes
  function processRemainingAttributes(
    obj: Record<string, unknown>,
    basePath: Array<string | number> = []
  ): FormattedAttribute[] {
    const attributes: FormattedAttribute[] = []

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue

      const currentPath = [...basePath, key]
      const pathKey = currentPath.join('.')

      // Skip if already processed
      if (processedPaths.has(pathKey)) continue

      const label = mapAttributeName(key)
      const formatted = formatAttributeValue(key, value, currentPath, label)

      attributes.push(formatted)
    }

    return attributes
  }

  // Add remaining attributes that weren't in claim metadata
  const remainingAttributes = processRemainingAttributes(rawAttributes)
  formattedAttributes.push(...remainingAttributes)

  return formattedAttributes
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

    // Extract claims metadata
    const claims = sdJwtTypeMetadata?.claims ?? openId4VcMetadata?.credential.claims

    // Format displayed attributes (only those in claim metadata)
    const displayedAttributes =
      formatDisplayedAttributes(attributes, claims, i18n.locale) ?? formatAllAttributes(attributes, claims, i18n.locale)

    // Format all attributes (prioritize claim paths but include everything)
    const allAttributes = formatAllAttributes(attributes, claims, i18n.locale)

    // Check if displayed attributes are different from all attributes
    const hasCustomDisplay = displayedAttributes.length !== allAttributes.length

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      displayedAttributes,
      allAttributes,
      rawAttributes: attributes,
      hasCustomDisplay,
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

    // Extract claims metadata
    const claims = openId4VcMetadata?.credential.claims

    console.log(
      mdocInstance.docType,
      JSON.stringify(
        {
          issuerSignedNamespaces: mdocInstance.issuerSignedNamespaces,
          claims,
          attributes,
          attributesWithoutNamespace,
        },
        null,
        2
      )
    )
    // Format displayed attributes (only those in claim metadata)
    // For mdoc, we use attributes (with namespace) for claim resolution, but fallback to attributesWithoutNamespace
    const displayedAttributes =
      formatDisplayedAttributes(attributes, claims, i18n.locale) ??
      formatAllAttributes(attributesWithoutNamespace, claims, i18n.locale)

    // Format all attributes (prioritize claim paths but include everything)
    const allAttributes = formatAllAttributes(attributesWithoutNamespace, claims, i18n.locale)

    // Check if displayed attributes are different from all attributes
    const hasCustomDisplay = displayedAttributes.length !== allAttributes.length

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      displayedAttributes,
      allAttributes,
      rawAttributes: attributes,
      hasCustomDisplay,
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

    // Extract claims metadata
    const claims = openId4VcMetadata?.credential.claims

    // Format displayed attributes (only those in claim metadata)
    const displayedAttributes =
      formatDisplayedAttributes(credentialAttributes, claims, i18n.locale) ??
      formatAllAttributes(credentialAttributes, claims, i18n.locale)

    // Format all attributes (prioritize claim paths but include everything)
    const allAttributes = formatAllAttributes(credentialAttributes, claims, i18n.locale)

    // Check if displayed attributes are different from all attributes
    const hasCustomDisplay = displayedAttributes.length !== allAttributes.length

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      displayedAttributes,
      allAttributes,
      rawAttributes: credentialAttributes,
      hasCustomDisplay,
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

    // Extract claims metadata
    const claims = openId4VcMetadata?.credential.claims

    // Format displayed attributes (only those in claim metadata)
    const displayedAttributes =
      formatDisplayedAttributes(credentialAttributes, claims, i18n.locale) ??
      formatAllAttributes(credentialAttributes, claims, i18n.locale)

    // Format all attributes (prioritize claim paths but include everything)
    const allAttributes = formatAllAttributes(credentialAttributes, claims, i18n.locale)

    // Check if displayed attributes are different from all attributes
    const hasCustomDisplay = displayedAttributes.length !== allAttributes.length

    return {
      id: credentialForDisplayId,
      createdAt: credentialRecord.createdAt,
      display: {
        ...credentialDisplay,
        issuer: issuerDisplay,
      },
      displayedAttributes,
      allAttributes,
      rawAttributes: credentialAttributes,
      hasCustomDisplay,
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
