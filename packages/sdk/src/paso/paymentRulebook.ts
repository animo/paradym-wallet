import { findProhibitedDirectionalCharacters } from './labelConstraints'
import type { PasoClaimMetadata } from './types'
import { validatePasoValue } from './valueTypes'

/**
 * The Basic Payments Transaction Data Type Rulebook.
 *
 * https://aptitude-consortium.github.io/payments-and-sca-for-openid/draft-2/rulebooks/transaction_data/Payment/
 *
 * The rulebook — not the credential metadata — is the authority on the payload's structure
 * ([PaSO Core] Section 7.1). The metadata only supplies rendering hints. That is the inversion from
 * TS 12, where the claims metadata defined the shape, and it is why the table below is hard-coded
 * here rather than read from the issuer.
 *
 * Six claims, down from TS 12's nineteen. In particular `payee.id` changed meaning: it is now the
 * Payee's national tax identifier or business registry number, not a payment-network identifier.
 */

export const pasoPaymentTransactionDataType = 'urn:paso:sca:global:payment:1'

const integritySuffix = '#integrity'

export interface PasoRulebookClaim {
  /** Resolved against the `transaction_data` `payload` object. */
  path: string[]
  mandatory: boolean
  /** `undefined` is the rulebook's _(text)_ column: plain text. */
  valueType?: string
  /** Whether the rulebook designates the claim for display. */
  display: boolean
}

export interface PasoRulebook {
  type: string
  claims: PasoRulebookClaim[]
}

/** Section 1 of the rulebook. The order of this array is the normative claim order. */
export const pasoPaymentRulebook: PasoRulebook = {
  type: pasoPaymentTransactionDataType,
  claims: [
    { path: ['transaction_id'], mandatory: false, display: false },
    { path: ['amount'], mandatory: true, valueType: 'iso_currency_amount', display: true },
    { path: ['payee', 'name'], mandatory: true, display: true },
    { path: ['payee', 'id'], mandatory: true, display: false },
    { path: ['payee', 'logo'], mandatory: false, valueType: 'image', display: true },
    { path: ['payee', `logo${integritySuffix}`], mandatory: false, display: false },
  ],
}

export function getPasoRulebook(type: string): PasoRulebook | undefined {
  return type === pasoPaymentTransactionDataType ? pasoPaymentRulebook : undefined
}

function readPath(payload: Record<string, unknown>, path: string[]): { present: boolean; value: unknown } {
  let current: unknown = payload

  for (const segment of path) {
    if (typeof current !== 'object' || current === null || Array.isArray(current))
      return { present: false, value: undefined }
    if (!(segment in (current as Record<string, unknown>))) return { present: false, value: undefined }
    current = (current as Record<string, unknown>)[segment]
  }

  return { present: true, value: current }
}

/** Every leaf path present in the payload, so undeclared fields can be spotted. */
function collectLeafPaths(value: unknown, prefix: string[] = []): string[][] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix]

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectLeafPaths(nested, [...prefix, key])
  )
}

/** Every string anywhere in the payload, for the character checks of [PaSO Proof Metadata] 3.3. */
function collectStrings(value: unknown, prefix: string[] = []): Array<{ path: string[]; value: string }> {
  if (typeof value === 'string') return [{ path: prefix, value }]
  if (typeof value !== 'object' || value === null) return []

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    collectStrings(nested, [...prefix, key])
  )
}

const pathKey = (path: Array<string | null>) => path.join(' ')

/**
 * Whether `leafPath` is covered by one of the declared claim paths.
 *
 * [PaSO Core] Section 7.4.2 step 2 carves out one exception, which is easy to miss: "companion
 * `#integrity` fields are covered by the `path` of the claim they accompany". So a payload carrying
 * `payee.logo#integrity` is covered by a `payee.logo` claim even where the metadata does not declare
 * the companion separately.
 */
function isCoveredByDeclaredPaths(declared: Set<string>, leafPath: string[]): boolean {
  if (declared.has(pathKey(leafPath))) return true

  const leaf = leafPath.at(-1) ?? ''
  if (!leaf.endsWith(integritySuffix)) return false

  return declared.has(pathKey([...leafPath.slice(0, -1), leaf.slice(0, -integritySuffix.length)]))
}

export type PasoPayloadConformance = { conforms: true } | { conforms: false; reason: string }

/**
 * Whether a `payload` conforms to its Transaction Data Type Rulebook.
 *
 * [PaSO Core] Section 7.4.2 step 2 defines conformance as: no fields the rulebook does not declare,
 * no fields not covered by a claim `path` in the applicable claims metadata, every required field
 * present, every display formatting directive supported, and every value conforming to its declared
 * formatting. A payload that fails any of them makes the entry incompatible — the Wallet ceases
 * processing and tells the user (Section 7.3 step 2).
 *
 * Both sources are genuinely consulted, and for different reasons. The rulebook lets an Attestation
 * Provider add claims of its own as long as they carry no `display` array, so a rulebook-only check
 * would reject a payload the rulebook explicitly permits. The metadata-coverage half is the
 * spec's own wording, and it is what stops an issuer's metadata and the Relying Party's payload from
 * drifting apart: a field nothing describes is a field the wallet cannot honestly show.
 *
 * The metadata's own well-formedness is *not* checked here — that is
 * {@link findPasoMetadataConstraintIssue}, which runs against the type rather than the payload.
 */
export function validatePasoPayloadConformance(options: {
  payload: Record<string, unknown>
  rulebook: PasoRulebook
  /**
   * Absent when no credential in the wallet can authorize the transaction.
   *
   * There is then no signed metadata to read, and the checks that need it are skipped — but the
   * rulebook half still runs, because the rulebook is the payload's structural authority
   * ([PaSO Core] Section 7.1) and the wallet is about to put the amount and payee on screen.
   */
  claimsMetadata?: PasoClaimMetadata[]
}): PasoPayloadConformance {
  const { payload, rulebook, claimsMetadata } = options

  // Array wildcards need the recursive renderer of [PaSO View] Section 2, which this wallet does not
  // have. Refusing is the correct outcome: the alternative is showing an incomplete consent screen.
  if (claimsMetadata?.some((claim) => claim.path.includes(null))) {
    return { conforms: false, reason: 'claims metadata uses an array wildcard path, which this wallet cannot render' }
  }

  const rulebookByPath = new Map(rulebook.claims.map((claim) => [pathKey(claim.path), claim]))
  const metadataByPath = new Map((claimsMetadata ?? []).map((claim) => [pathKey(claim.path), claim]))
  const metadataPaths = new Set(metadataByPath.keys())

  for (const leafPath of collectLeafPaths(payload)) {
    const readable = leafPath.join('.')
    const key = pathKey(leafPath)

    // Covered by a claim `path` in the applicable claims metadata.
    if (claimsMetadata && !isCoveredByDeclaredPaths(metadataPaths, leafPath)) {
      return { conforms: false, reason: `payload field '${readable}' is not covered by the claims metadata` }
    }

    // Declared by the rulebook, or an issuer extension of it.
    if (rulebookByPath.has(key)) continue

    const extension = metadataByPath.get(key)
    if (!extension) {
      return { conforms: false, reason: `payload contains undeclared field '${readable}'` }
    }
    if (extension.display) {
      return {
        conforms: false,
        reason: `payload field '${readable}' is not part of the rulebook but declares a display array`,
      }
    }
  }

  // Every required field present, and every value conforming to its declared formatting.
  for (const claim of rulebook.claims) {
    const { present, value } = readPath(payload, claim.path)
    const readable = claim.path.join('.')

    if (!present) {
      if (claim.mandatory) return { conforms: false, reason: `payload is missing required field '${readable}'` }
      continue
    }

    const issue = validatePasoValue(value, claim.valueType, {
      hasIntegritySibling: readPath(payload, [...claim.path.slice(0, -1), `${claim.path.at(-1)}${integritySuffix}`])
        .present,
    })
    if (issue) return { conforms: false, reason: `payload field '${readable}': ${issue.reason}` }
  }

  // [PaSO Proof Metadata] Section 3.3 applies its directional-character prohibition to "`payload`
  // string values" as well as to labels, and [PaSO View] Section 2 says to exclude an entry "whose
  // formatted claim values contain the directional formatting characters prohibited by Section 3.3".
  for (const { path, value } of collectStrings(payload)) {
    const issue = findProhibitedDirectionalCharacters(value)
    if (issue) return { conforms: false, reason: `payload field '${path.join('.')}' ${issue}` }
  }

  // The metadata must describe the claims the way the rulebook fixed them. The rulebook is explicit:
  // "Attestation Providers SHALL use the claims exactly as specified below." A metadata entry that
  // marks a claim for display which the rulebook does not — or renames its value type — would have
  // this wallet's dedicated UI silently show something other than what was described.
  if (!claimsMetadata) return { conforms: true }

  for (const claim of rulebook.claims) {
    const metadata = metadataByPath.get(pathKey(claim.path))
    if (!metadata) continue

    const readable = claim.path.join('.')

    if (claim.display && !metadata.display) {
      return { conforms: false, reason: `the claims metadata gives claim '${readable}' no display array` }
    }
    if (!claim.display && metadata.display) {
      return { conforms: false, reason: `the claims metadata marks claim '${readable}' for display` }
    }
    if ((metadata.value_type ?? undefined) !== claim.valueType) {
      return {
        conforms: false,
        reason: `the claims metadata declares value_type '${String(metadata.value_type)}' for claim '${readable}'`,
      }
    }
  }

  return { conforms: true }
}

/** The payload shape of `urn:paso:sca:global:payment:1`, once it has been found to conform. */
export interface PasoPaymentPayload {
  transaction_id?: string
  amount: string
  payee: {
    name: string
    id: string
    logo?: string
    'logo#integrity'?: string
  }
}
