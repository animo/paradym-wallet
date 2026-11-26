import { resolvePasoImageUrl, validatePasoDataUrlImage } from './image'
import { findDisplayStringIssue } from './labelConstraints'
import { resolveLocalisedEntry } from './locale'
import type { PasoRulebook } from './paymentRulebook'
import type { PasoClaimMetadata, PasoDisplayEntry } from './types'

/**
 * Turns a conforming payload and its claims metadata into what the consent screen shows, per
 * [PaSO View] Sections 2 and 3.
 *
 * Values stay typed rather than formatted: a date, an amount or a frequency has to be written out in
 * the user's language, and the SDK is not translated. The app formats each {@link PasoDisplayValue}.
 */

/** [PaSO View] Section 3 — a claim value, typed so the app can format it in the user's locale. */
export type PasoDisplayValue =
  | { type: 'text'; value: string }
  | { type: 'mini_markdown'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'frequency'; value: string }
  | { type: 'iso_date'; value: string }
  | { type: 'iso_time'; value: string }
  | { type: 'iso_date_time'; value: string }
  | { type: 'iso_currency'; value: string }
  | { type: 'iso_currency_amount'; value: string }
  | { type: 'url'; value: string }
  /** The `data:` URL of the verified image bytes, never the URL it was fetched from. */
  | { type: 'image'; dataUrl: string }
  /** [PaSO View] Section 3 `template:` — literal text with formatted claim values in between. */
  | { type: 'template'; markdown: boolean; parts: PasoDisplayPart[] }

/** A string is the template's own text, an object a claim value inserted into it. */
export type PasoDisplayPart = string | Exclude<PasoDisplayValue, { type: 'template' | 'image' }>

/** A claim label, which a `template:mini_markdown` display type turns into parts like a value. */
export interface PasoDisplayLabel {
  markdown: boolean
  parts: PasoDisplayPart[]
}

/**
 * One row of the consent screen.
 *
 * A claim without a value is shown as its label alone: a `label_only` claim, or a Generic custom claim
 * whose value is `null` ([Generic] Section 3.1).
 */
export type PasoDisplayItem =
  | { kind: 'claim'; path: Array<string | number>; label: PasoDisplayLabel; value?: PasoDisplayValue }
  /** An embedded `payment_payload`, rendered as its own delimited section ([Mandate] 2.2, [Generic] 3.2). */
  | { kind: 'payment'; path: string[]; payment: PasoPaymentDisplay }

export interface PasoDisplayedClaim {
  /**
   * The issuer's label for the claim, where there is one.
   *
   * Absent only when no card can authorize the transaction, which is the one case where there is no
   * signed metadata to take a label from. The wallet supplies its own translated label then.
   */
  label?: string
  value: string
}

/** A `urn:paso:sca:global:payment:1` payload, laid out by the dedicated payment hierarchy. */
export interface PasoPaymentDisplay {
  /** Always an `iso_currency_amount` string, whichever form the payload used. */
  amount: PasoDisplayedClaim
  payee: PasoDisplayedClaim
  /** A `data:` URL of the SRI-verified logo bytes, never the original URL. */
  payeeLogo?: { label?: string; dataUrl: string }
}

/** A claim without a display array, for the separate details view [PaSO View] Section 2 allows. */
export interface PasoDetailClaim {
  path: string
  value: string
}

/** [PaSO View] Section 2 — "SHALL be at least 200". The wallet uses exactly that. */
export const maxPasoRenderedItems = 200

export class PasoRenderError extends Error {
  public constructor(
    message: string,
    public readonly detail: 'labelTooLong' | 'directionalCharacters' | 'imageNotVerified' | 'unsupportedValueType'
  ) {
    super(message)
  }
}

const placeholderPattern = /\{(\d+)\}/g

function readPath(payload: unknown, path: Array<string | null>): { present: boolean; value: unknown } {
  let current = payload
  for (const segment of path) {
    if (segment === null || typeof current !== 'object' || current === null || Array.isArray(current)) {
      return { present: false, value: undefined }
    }
    if (!(segment in current)) return { present: false, value: undefined }
    current = (current as Record<string, unknown>)[segment]
  }
  return { present: true, value: current }
}

const pathKey = (path: Array<string | null | number>) => path.join(' ')

// A plain-text value is a `text` part rather than a string, so it can't be mistaken for the template's own text
function toPart(value: unknown, valueType: string | undefined): Exclude<PasoDisplayPart, string> | undefined {
  if (valueType === undefined) return typeof value === 'string' ? { type: 'text', value } : undefined
  if (valueType === 'boolean') return typeof value === 'boolean' ? { type: 'boolean', value } : undefined
  if (typeof value !== 'string') return undefined
  if (valueType === 'mini_markdown') return { type: 'mini_markdown', value }
  if (
    valueType === 'frequency' ||
    valueType === 'iso_date' ||
    valueType === 'iso_time' ||
    valueType === 'iso_date_time' ||
    valueType === 'iso_currency' ||
    valueType === 'iso_currency_amount' ||
    valueType === 'url'
  ) {
    return { type: valueType, value }
  }
  return undefined
}

/**
 * [PaSO View] Section 3 `template:` — splits a template into literal text and the values of the claims
 * it references.
 *
 * Returns `'absent'` when a referenced claim is missing from the payload, which discards the entry
 * rather than failing it. Throws for what the spec makes incompatible: referencing an `image`,
 * `label_only` or `template:` claim, or a plain-text claim whose value is not a string.
 */
export function interpolatePasoTemplate(
  template: string,
  claims: PasoClaimMetadata[],
  payload: Record<string, unknown>
): PasoDisplayPart[] | 'absent' {
  const parts: PasoDisplayPart[] = []
  let lastIndex = 0

  for (const match of template.matchAll(placeholderPattern)) {
    const claim = claims[Number(match[1])]
    // Out of bounds: "the placeholder SHALL be treated as literal text".
    if (!claim) continue

    if (
      claim.value_type === 'image' ||
      claim.value_type === 'label_only' ||
      claim.value_type?.startsWith('template:')
    ) {
      throw new PasoRenderError(
        `a template references claim '${claim.path.join('.')}', whose value_type '${claim.value_type}' cannot be interpolated`,
        'unsupportedValueType'
      )
    }

    const { present, value } = readPath(payload, claim.path)
    if (!present || value === null) return 'absent'

    const part = toPart(value, claim.value_type)
    if (part === undefined) {
      throw new PasoRenderError(
        `a template references claim '${claim.path.join('.')}', whose value cannot be inserted`,
        'unsupportedValueType'
      )
    }

    if (match.index > lastIndex) parts.push(template.slice(lastIndex, match.index))
    parts.push(part)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < template.length) parts.push(template.slice(lastIndex))
  return parts
}

/** A part as plain text, which is what the label constraints of Section 2 are checked against. */
function rawText(part: PasoDisplayPart) {
  if (typeof part === 'string') return part
  return String(part.value)
}

/**
 * The display arrays of the claims with the entries the payload makes unusable left out: a
 * `template:` label referencing a claim the payload does not carry is discarded ([PaSO View] Section 3),
 * which locale selection has to see before it runs.
 */
export function withoutDiscardedTemplateEntries(
  claims: PasoClaimMetadata[],
  payload: Record<string, unknown>
): PasoClaimMetadata[] {
  return claims.map((claim) =>
    claim.display
      ? {
          ...claim,
          display: claim.display.filter(
            (entry) =>
              !entry.display_type?.startsWith('template:') ||
              interpolatePasoTemplate(entry.name, claims, payload) !== 'absent'
          ),
        }
      : claim
  )
}

function resolveLabel(
  entry: PasoDisplayEntry,
  claims: PasoClaimMetadata[],
  payload: Record<string, unknown>
): PasoDisplayLabel {
  if (!entry.display_type?.startsWith('template:')) {
    return { markdown: entry.display_type === 'mini_markdown', parts: [entry.name] }
  }

  const parts = interpolatePasoTemplate(entry.name, claims, payload)
  // Discarded entries never reach locale selection, so this is only defensive.
  if (parts === 'absent') return { markdown: false, parts: [entry.name] }

  // [PaSO View] Section 2: for a template the label constraints apply to the interpolated result.
  // shortcut: checked against the raw values, not the formatted ones the app shows; upgrade if a
  // formatted value can be longer than its raw form.
  const issue = findDisplayStringIssue(parts.map(rawText).join(''), 60)
  if (issue) {
    throw new PasoRenderError(
      `the interpolated label '${entry.name}' ${issue}`,
      issue.includes('direction') ? 'directionalCharacters' : 'labelTooLong'
    )
  }

  return { markdown: entry.display_type === 'template:mini_markdown', parts }
}

async function resolveImage(value: string, integrity: unknown): Promise<string> {
  const result = value.startsWith('data:')
    ? validatePasoDataUrlImage(value)
    : typeof integrity === 'string'
      ? await resolvePasoImageUrl(value, integrity)
      : { error: 'the image is missing its integrity value' }

  if ('error' in result) throw new PasoRenderError(result.error, 'imageNotVerified')
  return result.dataUrl
}

async function resolveValue(
  claim: PasoClaimMetadata,
  value: unknown,
  claims: PasoClaimMetadata[],
  payload: Record<string, unknown>,
  integrity: unknown
): Promise<PasoDisplayValue | undefined> {
  if (claim.value_type === 'label_only' || value === null) return undefined
  if (claim.value_type === 'image') return { type: 'image', dataUrl: await resolveImage(value as string, integrity) }

  if (claim.value_type?.startsWith('template:')) {
    const parts = interpolatePasoTemplate(value as string, claims, payload)
    if (parts === 'absent') {
      throw new PasoRenderError(
        `the template of claim '${claim.path.join('.')}' references a claim that is not in the payload`,
        'unsupportedValueType'
      )
    }
    return { type: 'template', markdown: claim.value_type === 'template:mini_markdown', parts }
  }

  const part = toPart(value, claim.value_type)
  if (part === undefined) {
    throw new PasoRenderError(
      `claim '${claim.path.join('.')}' has a value this wallet cannot display`,
      'unsupportedValueType'
    )
  }
  return part
}

/** The value of a claim without a display array, as the details view shows it. */
function detailValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/**
 * Resolves the label, the payload values and the logo of an embedded or top-level Payment payload.
 *
 * `claims` are the metadata claims relative to the payment payload, so `['amount']`, not
 * `['payment_payload', 'amount']`.
 */
export async function resolvePasoPaymentDisplay(options: {
  payload: Record<string, unknown>
  amount: string
  claims?: PasoClaimMetadata[]
  locale?: string
}): Promise<PasoPaymentDisplay> {
  const { payload, amount, claims, locale } = options
  const label = (path: string[]) =>
    claims && locale
      ? resolveLocalisedEntry(claims.find((claim) => pathKey(claim.path) === pathKey(path))?.display, locale)?.name
      : undefined

  const payee = payload.payee as { name: string; logo?: string; 'logo#integrity'?: string }

  return {
    amount: { label: label(['amount']), value: amount },
    payee: { label: label(['payee', 'name']), value: payee.name },
    payeeLogo: payee.logo
      ? { label: label(['payee', 'logo']), dataUrl: await resolveImage(payee.logo, payee['logo#integrity']) }
      : undefined,
  }
}

/**
 * The rows of a consent screen for any transaction data type other than the bare Payment one, which
 * has its own hierarchy.
 *
 * The order is the claims array's ([PaSO View] Section 2), except for the Generic rulebook, whose
 * Section 4 takes precedence with the payload's own order. An embedded Payment payload follows the
 * claims of a Mandate ([Mandate] 2.2) and keeps its place in a Generic payload ([Generic] 4).
 */
export async function resolvePasoDisplayItems(options: {
  payload: Record<string, unknown>
  claims: PasoClaimMetadata[]
  rulebook: PasoRulebook
  locale: string
  resolveEmbeddedPayment: (payload: Record<string, unknown>, claims: PasoClaimMetadata[]) => Promise<PasoPaymentDisplay>
}): Promise<{ items: PasoDisplayItem[]; details: PasoDetailClaim[] }> {
  const { payload, claims, rulebook, locale } = options
  const embeddedKey = rulebook.embeddedPaymentKey

  const items: PasoDisplayItem[] = []
  const details: PasoDetailClaim[] = []

  const embeddedPayment = async (): Promise<PasoDisplayItem | undefined> => {
    if (!embeddedKey || typeof payload[embeddedKey] !== 'object' || payload[embeddedKey] === null) return undefined

    const embeddedClaims = claims
      .filter((claim) => claim.path[0] === embeddedKey)
      .map((claim) => ({ ...claim, path: claim.path.slice(1) }))
    const embeddedPayload = payload[embeddedKey] as Record<string, unknown>

    for (const claim of embeddedClaims) {
      const { present, value } = readPath(embeddedPayload, claim.path)
      if (present && !claim.display && !claim.path.at(-1)?.endsWith('#integrity')) {
        details.push({ path: [embeddedKey, ...claim.path].join('.'), value: detailValue(value) })
      }
    }

    return {
      kind: 'payment',
      path: [embeddedKey],
      payment: await options.resolveEmbeddedPayment(embeddedPayload, embeddedClaims),
    }
  }

  const claimItem = async (claim: PasoClaimMetadata): Promise<PasoDisplayItem | undefined> => {
    const { present, value } = readPath(payload, claim.path)
    if (!present) return undefined

    if (!claim.display) {
      if (!claim.path.at(-1)?.endsWith('#integrity')) {
        details.push({ path: claim.path.join('.'), value: detailValue(value) })
      }
      return undefined
    }

    const entry = resolveLocalisedEntry(claim.display, locale)
    if (!entry) return undefined

    const integrityPath = [...claim.path.slice(0, -1), `${claim.path.at(-1)}#integrity`]
    return {
      kind: 'claim',
      path: claim.path as string[],
      label: resolveLabel(entry, claims, payload),
      value: await resolveValue(claim, value, claims, payload, readPath(payload, integrityPath).value),
    }
  }

  const topLevelClaims = claims.filter((claim) => claim.path[0] !== embeddedKey)

  if (rulebook.renderInPayloadOrder) {
    for (const key of Object.keys(payload)) {
      if (key === embeddedKey) {
        const item = await embeddedPayment()
        if (item) items.push(item)
        continue
      }
      for (const claim of topLevelClaims.filter((claim) => claim.path[0] === key)) {
        const item = await claimItem(claim)
        if (item) items.push(item)
      }
    }
  } else {
    for (const claim of topLevelClaims) {
      const item = await claimItem(claim)
      if (item) items.push(item)
    }
    const item = await embeddedPayment()
    if (item) items.push(item)
  }

  const renderedCount = items.reduce((count, item) => count + (item.kind === 'payment' ? 3 : 1), 0)
  if (renderedCount > maxPasoRenderedItems) {
    throw new PasoRenderError(`the transaction renders more than ${maxPasoRenderedItems} items`, 'labelTooLong')
  }

  return { items, details }
}

/** The claims without a display array of a Payment payload, for the details view. */
export function getPasoPaymentDetails(payload: Record<string, unknown>, claims: PasoClaimMetadata[] | undefined) {
  const hidden = claims?.filter((claim) => !claim.display) ?? [{ path: ['transaction_id'] }, { path: ['payee', 'id'] }]

  return hidden.flatMap((claim): PasoDetailClaim[] => {
    if (claim.path.at(-1)?.endsWith('#integrity')) return []
    const { present, value } = readPath(payload, claim.path)
    return present ? [{ path: claim.path.join('.'), value: detailValue(value) }] : []
  })
}
