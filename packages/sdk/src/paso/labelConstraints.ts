import { isPermittedPasoLabelValueType, isSupportedPasoValueType } from './valueTypes'

/**
 * Label and structural constraints, per [PaSO Proof Metadata] Section 3.3.
 *
 * Every string on the consent screen comes from outside the wallet: labels from the Attestation
 * Provider's signed metadata, values from the Relying Party's payload. Section 3.3 bounds that
 * channel, and [PaSO View] Section 5.1 says plainly why the bounds exist — "to keep this channel
 * from being usable to obfuscate or forge consent content".
 *
 * Two of them are easy to underestimate:
 *
 * - **Length.** [PaSO View] Section 2 forbids truncating a label, so the only conforming response to
 *   an oversized one is to exclude the entry. Section 5.2 spells out the attack: a label crafted so
 *   the platform ellipsis cuts it after "Confirm payment of EUR 1.00" hides the continuation.
 * - **Directional formatting.** U+202A–U+202E re-order the rendering of the text that follows. A
 *   payee name carrying U+202E renders backwards, which is a payee substitution the user cannot see.
 *   The isolates U+2066–U+2068 are allowed, but only where each one is terminated.
 *
 * Section 3.3 closes with the rule that makes this a metadata check rather than a rendering one:
 * "Independent of rendering, the Wallet SHALL treat a transaction data type whose metadata violates
 * these constraints as not supported by the credential."
 */

/** Section 3.3 — maximum lengths in [UAX29] extended grapheme clusters. */
const maxClaimDisplayNameLength = 60

const maxUiLabelLengths: Record<string, number> = {
  transaction_title: 100,
  affirmative_action_label: 40,
  denial_action_label: 40,
  security_hint: 160,
}

/**
 * Section 3.3 — the fallback for UI element identifiers whose own specification fixes no maximum:
 * "if none is defined, a maximum of 100 grapheme clusters applies".
 */
const defaultUiLabelLength = 100

const maxClaimsPerType = 100

const zeroWidthJoiner = 0x200d

type Segmenter = { segment(input: string): Iterable<unknown> }

let cachedSegmenter: Segmenter | null | undefined

function isRegionalIndicator(codePoint: number): boolean {
  return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff
}

/** Combining marks, variation selectors and the joiner all attach to the preceding cluster. */
function isExtendingCodePoint(codePoint: number): boolean {
  return (
    codePoint === zeroWidthJoiner ||
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  )
}

/**
 * The number of extended grapheme clusters in `value`, per [UAX29].
 *
 * `Intl.Segmenter` is the correct implementation and is present in the Hermes builds this wallet
 * ships with, but it is not guaranteed by the language, so there is a fallback. The fallback errs
 * towards counting *fewer* clusters: it must never reject a label the correct implementation would
 * accept, because [PaSO View] Section 2 also obliges the wallet to display every conforming label.
 */
function countGraphemeClusters(value: string): number {
  if (cachedSegmenter === undefined) {
    const factory = (
      Intl as unknown as {
        Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter
      }
    ).Segmenter
    cachedSegmenter = factory ? new factory(undefined, { granularity: 'grapheme' }) : null
  }

  if (cachedSegmenter) return [...cachedSegmenter.segment(value)].length

  const codePoints = [...value].map((character) => character.codePointAt(0) ?? 0)
  let clusters = 0

  for (let index = 0; index < codePoints.length; index++) {
    if (isExtendingCodePoint(codePoints[index])) continue
    // A joiner swallows the code point that follows it into the same cluster.
    if (index > 0 && codePoints[index - 1] === zeroWidthJoiner) continue

    clusters++

    // A regional indicator pairs with the next one to form a single flag.
    if (isRegionalIndicator(codePoints[index]) && isRegionalIndicator(codePoints[index + 1] ?? 0)) index++
  }

  return clusters
}

/**
 * Section 3.3 — the directional formatting rule, for labels and `payload` string values alike.
 *
 * The embedding and override characters are prohibited outright. The isolates are permitted
 * "provided each isolate is properly terminated by U+2069", so an unbalanced one is rejected: an
 * isolate left open re-orders everything after it, including the wallet's own controls.
 */
export function findProhibitedDirectionalCharacters(value: string): string | undefined {
  let openIsolates = 0

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0

    // U+202A LEFT-TO-RIGHT EMBEDDING through U+202E RIGHT-TO-LEFT OVERRIDE.
    if (codePoint >= 0x202a && codePoint <= 0x202e) {
      return 'contains a prohibited directional embedding or override character'
    }

    // U+2066 through U+2068 open an isolate; U+2069 POP DIRECTIONAL ISOLATE closes one.
    if (codePoint >= 0x2066 && codePoint <= 0x2068) openIsolates++
    else if (codePoint === 0x2069) openIsolates = Math.max(0, openIsolates - 1)
  }

  return openIsolates > 0 ? 'contains an unterminated directional isolate' : undefined
}

/**
 * The reason `value` may not be used as a label, or `undefined` when it may.
 *
 * The directional half also applies to `payload` string values, which is what
 * {@link findProhibitedDirectionalCharacters} is for on its own.
 */
export function findDisplayStringIssue(value: string, maxLength: number): string | undefined {
  // Section 3.3 prohibits C0 (U+0000–U+001F) and C1 (U+0080–U+009F) control characters, which "also
  // prohibits line breaks within labels — line wrapping is a rendering decision of the Wallet".
  const hasControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1f || (codePoint >= 0x80 && codePoint <= 0x9f)
  })
  if (hasControlCharacter) return 'contains a control character'

  const directionalIssue = findProhibitedDirectionalCharacters(value)
  if (directionalIssue) return directionalIssue

  const length = countGraphemeClusters(value)
  if (length > maxLength) return `is ${length} grapheme clusters long, which exceeds the maximum of ${maxLength}`

  return undefined
}

type LocalisedEntry = { locale?: string }

/** Section 3.3 — no two entries with the same `locale`, and at most one without. */
function findLocalisedArrayIssue(entries: LocalisedEntry[], description: string): string | undefined {
  const locales = entries.map((entry) => entry.locale)

  const duplicate = locales.find((locale, index) => locale !== undefined && locales.indexOf(locale) !== index)
  if (duplicate) return `${description} declares '${duplicate}' more than once`

  if (locales.filter((locale) => locale === undefined).length > 1) {
    return `${description} declares more than one entry without a locale`
  }

  return undefined
}

export interface PasoMetadataConstraintsInput {
  claims: Array<{
    path: Array<string | null>
    display?: Array<{ locale?: string; name: string; display_type?: string }>
    value_type?: string
  }>
  ui_labels?: Record<string, Array<{ locale?: string; value: string; value_type?: string }> | undefined>
}

/**
 * The reason a `transaction_data_types` entry's metadata violates Section 3.3, or `undefined`.
 *
 * A violation means the type is **not supported by the credential**, which the caller turns into a
 * refusal rather than a warning — the alternative is asking the user to consent to a screen built
 * from strings the spec says cannot be displayed faithfully.
 */
export function findPasoMetadataConstraintIssue(metadata: PasoMetadataConstraintsInput): string | undefined {
  if (metadata.claims.length > maxClaimsPerType) {
    return `the claims array holds ${metadata.claims.length} entries, which exceeds the maximum of ${maxClaimsPerType}`
  }

  const paths = metadata.claims.map((claim) => claim.path.join(' '))
  const duplicatePath = paths.find((path, index) => paths.indexOf(path) !== index)
  if (duplicatePath !== undefined) {
    return `the claims array declares the path '${duplicatePath.split(' ').join('.')}' more than once`
  }

  for (const claim of metadata.claims) {
    const readablePath = claim.path.join('.')

    // Section 3.1: "The `value_type` parameter MUST NOT be used on claims without a `display` array."
    if (!claim.display && claim.value_type !== undefined) {
      return `claim '${readablePath}' declares a value_type without a display array`
    }

    if (!claim.display) continue

    if (!isSupportedPasoValueType(claim.value_type)) {
      return `claim '${readablePath}' declares unsupported value_type '${String(claim.value_type)}'`
    }

    const arrayIssue = findLocalisedArrayIssue(claim.display, `the display array of claim '${readablePath}'`)
    if (arrayIssue) return arrayIssue

    for (const entry of claim.display) {
      if (!isPermittedPasoLabelValueType(entry.display_type)) {
        return `claim '${readablePath}' declares display_type '${String(entry.display_type)}', which Section 3.3 does not permit for a label`
      }

      const issue = findDisplayStringIssue(entry.name, maxClaimDisplayNameLength)
      if (issue) return `the ${entry.locale ?? 'default'} label of claim '${readablePath}' ${issue}`
    }
  }

  for (const [key, entries] of Object.entries(metadata.ui_labels ?? {})) {
    if (!entries) continue

    const arrayIssue = findLocalisedArrayIssue(entries, `the '${key}' ui_labels array`)
    if (arrayIssue) return arrayIssue

    for (const entry of entries) {
      // Sections 3.2 and 3.3: "a `security_hint` entry MUST NOT carry a `value_type`".
      if (key === 'security_hint' && entry.value_type !== undefined) {
        return 'the security_hint carries a value_type, which Section 3.3 forbids'
      }

      if (!isPermittedPasoLabelValueType(entry.value_type)) {
        return `the '${key}' ui_labels entry declares value_type '${String(entry.value_type)}', which Section 3.3 does not permit for a label`
      }

      const issue = findDisplayStringIssue(entry.value, maxUiLabelLengths[key] ?? defaultUiLabelLength)
      if (issue) return `the ${entry.locale ?? 'default'} '${key}' ui_labels entry ${issue}`
    }
  }

  return undefined
}
