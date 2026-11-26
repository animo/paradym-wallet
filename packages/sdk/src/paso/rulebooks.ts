import { getPasoPaymentRulebook, type PasoRulebook, pasoPaymentTransactionDataType } from './paymentRulebook'
import type { PasoClaimMetadata } from './types'

/**
 * The Transaction Data Type Rulebooks this wallet implements, and the metadata-only fallback for
 * every other type, which [PaSO View] Section 2 asks a Wallet to render generically.
 *
 * https://aptitude-consortium.github.io/payments-and-sca-for-openid/latest/rulebooks/transaction_data/Mandate/
 * https://aptitude-consortium.github.io/payments-and-sca-for-openid/latest/rulebooks/transaction_data/Generic/
 */

/** [Mandate] Section 1 and [Generic] Section 1: the base type, or one lowercase subtype segment. */
const subtypePattern = (name: string) => new RegExp(`^urn:paso:sca:global:${name}(:[a-z0-9-]+)?:1$`)
const mandateTypePattern = subtypePattern('mandate')
const genericTypePattern = subtypePattern('generic')

/** Whether a PaSO transaction data type is the Mandate type or one of its subtypes. */
export const isPasoMandateType = (type: string) => mandateTypePattern.test(type)

/** [Mandate] Section 2, in table order. The embedded Payment payload is checked on its own. */
const mandateRulebook = (type: string): PasoRulebook => ({
  type,
  embeddedPaymentKey: 'payment_payload',
  claims: [
    { path: ['transaction_id'], mandatory: false, display: false },
    { path: ['mandate_id'], mandatory: true, display: true },
    { path: ['mandatee', 'name'], mandatory: true, display: true },
    { path: ['mandatee', 'id'], mandatory: false, display: false },
    { path: ['mandatee', 'logo'], mandatory: false, valueType: 'image', display: true },
    { path: ['mandatee', 'logo#integrity'], mandatory: false, display: false },
    { path: ['action'], mandatory: true, display: true },
    { path: ['conditions'], mandatory: false, valueType: 'mini_markdown', display: true },
    { path: ['max_amount'], mandatory: false, valueType: 'iso_currency_amount', display: true },
    { path: ['max_count'], mandatory: false, display: true },
    { path: ['period'], mandatory: false, display: true },
    { path: ['valid_from'], mandatory: false, valueType: 'iso_date', display: true },
    { path: ['valid_until'], mandatory: true, valueType: 'iso_date', display: true },
  ],
})

/** [Generic] Section 3: `transaction_id`, an optional Payment payload and up to 10 custom claims. */
const genericRulebook = (type: string): PasoRulebook => ({
  type,
  embeddedPaymentKey: 'payment_payload',
  maxCustomClaims: 10,
  maxProperties: 11,
  renderInPayloadOrder: true,
  claims: [{ path: ['transaction_id'], mandatory: true, display: false }],
})

/**
 * A type without a rulebook here, described by its metadata alone.
 *
 * [PaSO Core] Section 7.4.2 step 2 still applies in full: no field the metadata does not cover, every
 * `mandatory` claim present, every value conforming to its `value_type`.
 */
function metadataRulebook(type: string, claims: PasoClaimMetadata[]): PasoRulebook {
  return {
    type,
    claims: claims.map((claim) => ({
      path: claim.path as string[],
      mandatory: claim.mandatory === true,
      valueType: claim.value_type,
      display: claim.display !== undefined,
    })),
  }
}

/**
 * The rulebook a transaction is checked and rendered against.
 *
 * `claims` is only needed for a type without a rulebook here, and without it such a type is
 * unsupported: with no card there is no metadata to describe it.
 */
export function getPasoRulebook(
  type: string,
  payload: Record<string, unknown>,
  claims?: PasoClaimMetadata[]
): PasoRulebook | undefined {
  if (type === pasoPaymentTransactionDataType) return getPasoPaymentRulebook(payload)
  if (mandateTypePattern.test(type)) return mandateRulebook(type)
  if (genericTypePattern.test(type)) return genericRulebook(type)
  return claims ? metadataRulebook(type, claims) : undefined
}
