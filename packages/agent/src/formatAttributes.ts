import { DateOnly, type SdJwtVcTypeMetadataClaim, TypedArrayEncoder } from '@credo-ts/core'
import type { MessageDescriptor } from '@lingui/core'
import { commonMessages, i18n } from '@package/translations'
import { detectImageMimeType, formatDate, isDateString, isLikelyDate, sanitizeString } from '@package/utils'
import type { OpenId4VciCredentialDisplayClaims } from './openid4vc/displayMetadata'

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
  path: Array<string | number>
  /**
   * Index into the claims array if a matching claim was found for this node.
   * Serves as both a label-source indicator and an ordering signal.
   * undefined means no claim metadata matched this node.
   */
  claimIndex?: number
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

export type FormattedAttributePrimitive =
  | FormattedAttributeString
  | FormattedAttributeNumber
  | FormattedAttributeBoolean
  | FormattedAttributeDate
  | FormattedAttributeImage

export type FormattedAttribute = FormattedAttributePrimitive | FormattedAttributeArray | FormattedAttributeObject

// ─── Common Attribute name mapping ───────────────────────────────────────────────────
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

// ─── Display locale helpers ───────────────────────────────────────────────────

type SdJwtVcTypeMetadataClaimDisplayEntry = NonNullable<SdJwtVcTypeMetadataClaim['display']>[number]
type OpenId4VciCredentialClaimDisplayEntry = NonNullable<
  NonNullable<OpenId4VciCredentialDisplayClaims>[number]['display']
>[number]

/**
 * Finds the best matching display value for the current locale from an array of display objects.
 * Handles locale matching between IETF BCP 47 language tags (with region) and simple language codes (without region).
 */
export function findDisplayByLocale<Display extends { locale?: string }[]>(
  display?: Display,
  currentLocale?: string
): Display[number] | undefined {
  if (!display || display.length === 0) return undefined

  if (currentLocale) {
    const item = display.find((d) => d.locale === currentLocale || d.locale?.startsWith(`${currentLocale}-`))
    if (item) return item
  }

  const englishItem = display.find((d) => d.locale?.startsWith('en-') || d.locale === 'en')
  if (englishItem) return englishItem

  const noLocaleItem = display.find((d) => !d.locale)
  if (noLocaleItem) return noLocaleItem

  return display[0]
}

export function extractLabelFromDisplay(
  display?: SdJwtVcTypeMetadataClaimDisplayEntry | OpenId4VciCredentialClaimDisplayEntry
) {
  if (!display) return null

  // OpenID4VCI
  if ('name' in display && typeof display.name === 'string') return display.name

  // SD-JWT VC Type Metadata
  if ('label' in display && typeof display.label === 'string') return display.label

  return null
}

function extractDescriptionFromDisplay(
  display?: SdJwtVcTypeMetadataClaimDisplayEntry | OpenId4VciCredentialClaimDisplayEntry
): string | undefined {
  if (!display) return undefined

  // SD-JWT VC Type Metadata only (OpenID4VCI has no description in display)
  if ('description' in display && typeof display.description === 'string') return display.description

  return undefined
}

// ─── Claims path label resolution (used for unsatisfied/disclosed labels) ────

type AnyClaimEntry = {
  path?: Array<string | number | null>
  display?: Array<{ locale?: string; [key: string]: unknown }>
}

const pathsMatchExact = (
  claimPath: Array<string | number | null>,
  targetPath: Array<string | number | null>
): boolean => {
  if (claimPath.length !== targetPath.length) return false
  return claimPath.every((segment, i) => segment === targetPath[i])
}

const pathsMatchWithWildcard = (
  claimPath: Array<string | number | null>,
  targetPath: Array<string | number | null>
): boolean => {
  if (claimPath.length !== targetPath.length) return false
  return claimPath.every((segment, i) => segment === null || segment === targetPath[i])
}

/**
 * Finds the best matching claim for a given path using claims metadata.
 * Tries to match the exact path first, then falls back to wildcard (null) matching.
 * Returns both the claim and its index in the claims array, or undefined if no match.
 */
export function resolveClaimFromClaimsPath(
  path: Array<string | number | null>,
  claims?: OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[]
): { claim: AnyClaimEntry; index: number } | undefined {
  if (!claims || claims.length === 0) return undefined

  let wildcardMatch: { claim: AnyClaimEntry; index: number } | undefined

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i] as AnyClaimEntry
    if (!claim.path || claim.path.length === 0) continue

    if (pathsMatchExact(claim.path, path)) return { claim, index: i }

    if (!wildcardMatch && pathsMatchWithWildcard(claim.path, path)) {
      wildcardMatch = { claim, index: i }
    }
  }

  return wildcardMatch
}

/**
 * Resolves a label for a given path using claims metadata.
 * Tries to match the exact path first, then falls back to wildcard (null) matching.
 */
export function resolveLabelFromClaim(claim: AnyClaimEntry, currentLocale?: string): string | null {
  const displayItem = findDisplayByLocale(claim.display, currentLocale)
  return extractLabelFromDisplay(displayItem)
}

/**
 * Resolves a label for a given path using claims metadata.
 * Tries to match the exact path first, then falls back to wildcard (null) matching.
 */
export function resolveLabelFromClaimsPath(
  path: Array<string | number | null>,
  claims?: OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[],
  currentLocale?: string
): string | null {
  const match = resolveClaimFromClaimsPath(path, claims)
  if (!match) return null

  return resolveLabelFromClaim(match.claim, currentLocale)
}

// ─── Two-pass tree builder ────────────────────────────────────────────────────

export type ClaimMetadataArray = OpenId4VciCredentialDisplayClaims | SdJwtVcTypeMetadataClaim[]

/**
 * Pass 1 — Unified tree builder.
 * Builds a fully expanded FormattedAttribute tree for a single key/value node.
 * Sets claimIndex when a matching claim is found (used for ordering in Pass 2).
 * Does NOT collapse single-element arrays or single-entry objects — that is Pass 2's job.
 */
function buildFormattedAttributeTree(
  key: string | number,
  value: unknown,
  path: Array<string | number>,
  claims?: ClaimMetadataArray,
  currentLocale?: string
): FormattedAttribute {
  const claimMatch = resolveClaimFromClaimsPath(path, claims)
  const claimIndex = claimMatch?.index

  let label: string | undefined
  let description: string | undefined

  if (claimMatch) {
    const displayItem = findDisplayByLocale(claimMatch.claim.display, currentLocale)
    label = extractLabelFromDisplay(displayItem) ?? (typeof key === 'string' ? mapAttributeName(key) : undefined)
    description = extractDescriptionFromDisplay(displayItem)
  } else {
    label = typeof key === 'string' ? mapAttributeName(key) : undefined
    description = undefined
  }

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
        claimIndex,
        value: `data:${imageMimeType};base64,${TypedArrayEncoder.toBase64(value)}`,
      }
    }
    return {
      type: 'string',
      label,
      description,
      rawValue,
      path,
      claimIndex,
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
      claimIndex,
      value: formatDate(value instanceof DateOnly ? value.toISOString() : value),
    }
  }

  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) {
      return { type: 'image', label, description, rawValue, path, claimIndex, value }
    }
    if (isLikelyDate(value)) {
      return { type: 'date', label, description, rawValue, path, claimIndex, value }
    }
    return { type: 'string', label, description, rawValue, path, claimIndex, value }
  }

  if (typeof value === 'number') {
    return { type: 'number', label, description, rawValue, path, claimIndex, value }
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', label, description, rawValue, path, claimIndex, value }
  }

  if (value === null || value === undefined) {
    return { type: 'string', label, description, rawValue, path, claimIndex, value: '' }
  }

  // Handle arrays — fully expanded (no collapsing in Pass 1)
  if (Array.isArray(value)) {
    const formattedArray = value.map((item, index) => {
      const itemPath = [...path, index]
      return buildFormattedAttributeTree(index, item, itemPath, claims, currentLocale)
    })
    return { type: 'array', label, description, rawValue, path, claimIndex, value: formattedArray }
  }

  // Handle Maps
  if (value instanceof Map) {
    return buildFormattedAttributeTree(key, Object.fromEntries(value), path, claims, currentLocale)
  }

  // Handle objects — fully expanded (no collapsing in Pass 1)
  if (typeof value === 'object') {
    // Special case for image objects
    if ('type' in value && value.type === 'Image' && 'id' in value && typeof value.id === 'string') {
      return { type: 'image', value: value.id as string, label, rawValue: value, path, claimIndex, description }
    }

    const formattedEntries: FormattedAttribute[] = []
    for (const [objKey, objValue] of Object.entries(value)) {
      if (objValue === undefined || objValue === null) continue
      if (typeof objValue === 'object' && objValue !== null && Object.keys(objValue).length === 0) continue

      const objPath = [...path, objKey]
      formattedEntries.push(buildFormattedAttributeTree(objKey, objValue, objPath, claims, currentLocale))
    }

    return { type: 'object', label, description, rawValue, path, claimIndex, value: formattedEntries }
  }

  return { type: 'string', label, description, rawValue, path, claimIndex, value: String(value) }
}

/**
 * Builds the full attribute tree for rawAttributes.
 * Entry point for Pass 1.
 */
function buildAttributesTree(
  rawAttributes: Record<string, unknown>,
  claims?: ClaimMetadataArray,
  currentLocale?: string
): FormattedAttribute[] {
  const result: FormattedAttribute[] = []

  for (const [key, value] of Object.entries(rawAttributes)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue

    result.push(buildFormattedAttributeTree(key, value, [key], claims, currentLocale))
  }

  // If claims were provided, sort the attribute tree
  if (claims) {
    sortAttributeTree(result)
  }

  return result
}

/**
 * Pass 2 — Sort + Collapse.
 * Mutates the node array in-place: sorts by claimIndex (claimed first, ascending),
 * then unclaimed in original order. Then collapses unlabeled single-entry nodes
 * bottom-up (children first).
 *
 * Collapse rules:
 * - FormattedAttributeArray with one element AND claimIndex === undefined: unwrap, keep parent label
 * - FormattedAttributeObject with one child AND claimIndex === undefined: arrow-syntax collapse
 * - If claimIndex is set: never collapse (the claim explicitly declared this node)
 */
function sortAttributeTree(nodes: FormattedAttribute[]): FormattedAttribute[] {
  const claimed = nodes
    .filter((n): n is FormattedAttribute & { claimIndex: number } => n.claimIndex !== undefined)
    .sort((a, b) => a.claimIndex - b.claimIndex)
  const unclaimed = nodes.filter((n) => n.claimIndex === undefined)
  nodes.length = 0
  nodes.push(...claimed, ...unclaimed)

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if ((node.type === 'array' || node.type === 'object') && Array.isArray(node.value)) {
      sortAttributeTree(node.value)
    }
  }

  return nodes
}

/**
 * Formats all attributes with claim path ordering applied.
 * Claimed top-level nodes come first (sorted by claimIndex), unclaimed after.
 */
export function formatAllAttributes(
  rawAttributes: Record<string, unknown>,
  claims?: ClaimMetadataArray,
  currentLocale?: string
): FormattedAttribute[] {
  const tree = buildAttributesTree(rawAttributes, claims, currentLocale)
  return tree
}
