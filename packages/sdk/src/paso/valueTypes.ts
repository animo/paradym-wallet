import { validatePasoDataUrlImage } from './image'

/**
 * Value types, per [PaSO View] Section 3.
 *
 * This wallet does not implement [PaSO View] — it renders the Payment rulebook with a dedicated UI,
 * which View Section 1.1 allows and which is what keeps us off the hook for the advanced profile.
 * What we do need from View is the *validation* half: [PaSO Core] Section 7 makes a
 * `transaction_data` entry incompatible when a displayed claim declares a `value_type` the Wallet
 * does not support, or when a payload value does not conform to its declared type. Getting that
 * wrong means showing the user an amount the Authorizing Party will read differently.
 *
 * So every type below is *validated*; only the ones the Payment rulebook uses are *rendered*.
 * `template:${value_type}` is deliberately unsupported: it interpolates other claims into a string,
 * which only a generic renderer can do.
 */

/** [PaSO View] Section 3 — the twelve frequency codes. */
const frequencyCodes = ['INDA', 'DAIL', 'WEEK', 'TOWK', 'TWMN', 'MNTH', 'TOMN', 'QUTR', 'FOMN', 'SEMI', 'YEAR', 'TYEA']

const valueTypes = [
  'boolean',
  'frequency',
  'image',
  'iso_date',
  'iso_time',
  'iso_date_time',
  'iso_currency',
  'iso_currency_amount',
  'label_only',
  'mini_markdown',
  'url',
]

/**
 * [PaSO Proof Metadata] Section 3.3 — the only value types a *label* may declare.
 *
 * "Labels are text. A `display` entry's `display_type` and a `ui_labels` entry's `value_type` MUST
 * be either `mini_markdown` or `template:mini_markdown` [...], or absent (plain text). Value types
 * that produce non-textual or standalone content — in particular `image`, `url`, and `label_only` —
 * MUST NOT be used for labels."
 *
 * This is a different set from {@link isSupportedPasoValueType}, and conflating the two is the easy
 * mistake: it both accepts labels the spec forbids and rejects the one template form it requires.
 */
const labelValueTypes = ['mini_markdown', 'template:mini_markdown']

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const isoTimePattern = /^\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/
const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/
const isoCurrencyPattern = /^[A-Z]{3}$/

/**
 * [PaSO View] Section 3 `iso_currency_amount` — `"49.99 EUR"`.
 *
 * A decimal number, a single space, an [ISO4217] Alpha-3 code. Kept strict on purpose: this is the
 * value the user consents to and the Authorizing Party re-reads from the same string, so a lenient
 * parse here is a dynamic-linking bug.
 */
const isoCurrencyAmountPattern = /^\d+(\.\d{1,4})? [A-Z]{3}$/

export interface PasoValueTypeIssue {
  reason: string
}

/**
 * Whether `value` parses as an absolute URL.
 *
 * `new URL` rather than `URL.canParse`: the static method reaches us only through Expo's WinterCG
 * polyfill, while React Native's own `URL` has never had it. Depending on which of the two installed
 * itself last is not something the consent path should rest on.
 */
function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Whether the wallet can handle a declared `value_type` at all.
 *
 * A displayed claim declaring anything else makes the entry incompatible ([PaSO View] Section 3).
 */
export function isSupportedPasoValueType(valueType: string | undefined): boolean {
  return valueType === undefined || valueTypes.includes(valueType)
}

/** Whether [PaSO Proof Metadata] Section 3.3 permits `valueType` on a label. */
export function isPermittedPasoLabelValueType(valueType: string | undefined): boolean {
  return valueType === undefined || labelValueTypes.includes(valueType)
}

/**
 * Whether this wallet can render a label carrying `valueType`.
 *
 * `mini_markdown` is rendered as plain text, which [PaSO View] Section 3 explicitly allows ("or MAY
 * render the value as plain text without formatting"). `template:mini_markdown` is permitted by the
 * spec but needs the interpolation of Section 3, so it is unsupported here — and Section 3 says what
 * to do about that: such an entry "SHALL be excluded from the locale selection matching procedure",
 * not that the whole entry becomes incompatible.
 */
export function canRenderPasoLabelValueType(valueType: string | undefined): boolean {
  return valueType === undefined || valueType === 'mini_markdown'
}

/**
 * Whether a payload value conforms to its declared `value_type`.
 *
 * Returns the reason it does not, so the caller can tell the user *why* a transaction was refused
 * rather than only that it was.
 */
export function validatePasoValue(
  value: unknown,
  valueType: string | undefined,
  options: { hasIntegritySibling?: boolean } = {}
): PasoValueTypeIssue | undefined {
  // [PaSO View] Section 3: no `value_type` means plain text, and the value MUST be a string.
  if (valueType === undefined) {
    return typeof value === 'string' ? undefined : { reason: 'value without a value_type must be a string' }
  }

  // `label_only` renders the label alone, so the value may be of any JSON type.
  if (valueType === 'label_only') return undefined

  if (valueType === 'boolean') {
    return typeof value === 'boolean' ? undefined : { reason: 'value must be a JSON boolean' }
  }

  if (typeof value !== 'string') {
    return { reason: `value of type '${valueType}' must be a string` }
  }

  switch (valueType) {
    case 'frequency':
      return frequencyCodes.includes(value) ? undefined : { reason: `'${value}' is not a known frequency code` }
    case 'iso_date':
      return isoDatePattern.test(value) ? undefined : { reason: `'${value}' is not an ISO 8601 date` }
    case 'iso_time':
      return isoTimePattern.test(value) ? undefined : { reason: `'${value}' is not an ISO 8601 time` }
    case 'iso_date_time':
      return isoDateTimePattern.test(value) ? undefined : { reason: `'${value}' is not an ISO 8601 date-time` }
    case 'iso_currency':
      return isoCurrencyPattern.test(value) ? undefined : { reason: `'${value}' is not an ISO 4217 currency code` }
    case 'iso_currency_amount':
      return isoCurrencyAmountPattern.test(value)
        ? undefined
        : { reason: `'${value}' is not an amount followed by an ISO 4217 currency code` }
    case 'url':
      // Section 3: "The URL MUST use the `https` scheme; otherwise the `transaction_data` entry is
      // not compatible."
      if (!isAbsoluteUrl(value)) return { reason: `'${value}' is not a URL` }
      return isHttpsUrl(value) ? undefined : { reason: `'${value}' does not use the https scheme` }
    case 'mini_markdown':
      return undefined
    case 'image': {
      // A Data URL carries its own bytes and is checked against the Section 3 limits right here. Any
      // other URL must be https and must have an `#integrity` sibling claim, which the caller
      // resolves and verifies before the entry is considered compatible.
      if (value.startsWith('data:')) {
        const result = validatePasoDataUrlImage(value)
        return 'error' in result ? { reason: result.error } : undefined
      }
      if (!isAbsoluteUrl(value)) return { reason: `'${value}' is neither a Data URL nor a resolvable URL` }
      if (!isHttpsUrl(value)) return { reason: `'${value}' does not use the https scheme` }
      return options.hasIntegritySibling ? undefined : { reason: 'image URL is missing its `#integrity` sibling claim' }
    }
    default:
      return { reason: `value_type '${valueType}' is not supported by this wallet` }
  }
}
