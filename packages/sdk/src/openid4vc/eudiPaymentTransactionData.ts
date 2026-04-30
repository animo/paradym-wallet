import type { ScaCredentialMetadata } from '@animo-id/eudi-wallet-ts12-validation'
import { Hasher, TypedArrayEncoder } from '@credo-ts/core'

export const EUDI_PAYMENT_TRANSACTION_DATA_TYPE = 'urn:eudi:sca:global:payment:1'
// Deprecated compatibility for requests produced by eudi-payments.animo.id.
export const EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE = 'urn:eudi:sca:payment:1'
export const EUDI_PAYMENT_TRANSACTION_DATA_TYPES = [
  EUDI_PAYMENT_TRANSACTION_DATA_TYPE,
  EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE,
] as const

export type EudiPaymentTransactionDataType = (typeof EUDI_PAYMENT_TRANSACTION_DATA_TYPES)[number]

export const eudiPaymentTransactionDataClaims: ScaCredentialMetadata['transaction_data_types'][string]['claims'] = [
  {
    path: ['transaction_id'],
    mandatory: false,
  },
  {
    path: ['amount'],
    mandatory: true,
    value_type: 'iso_currency_amount',
    display: [{ name: 'Amount', display_type: 'iso_currency_amount' }],
  },
  {
    path: ['currency'],
    mandatory: false,
  },
  {
    path: ['payee', 'name'],
    mandatory: true,
    display: [{ name: 'Payee' }],
  },
  {
    path: ['payee', 'id'],
    mandatory: true,
  },
  {
    path: ['payee', 'logo'],
    mandatory: false,
    value_type: 'image',
    display: [{ name: 'Payee logo', display_type: 'image' }],
  },
  {
    path: ['payee', 'logo#integrity'],
    mandatory: false,
  },
]

const eudiPaymentsAnimoTransactionDataClaims: ScaCredentialMetadata['transaction_data_types'][string]['claims'] = [
  {
    path: ['transaction_id'],
    mandatory: false,
  },
  {
    path: ['amount'],
    mandatory: true,
  },
  {
    path: ['currency'],
    mandatory: true,
  },
  {
    path: ['payee', 'name'],
    mandatory: true,
    display: [{ name: 'Payee' }],
  },
  {
    path: ['payee', 'id'],
    mandatory: true,
  },
  {
    path: ['payee', 'logo'],
    mandatory: false,
  },
  {
    path: ['payee', 'logo#integrity'],
    mandatory: false,
  },
]

export const eudiPaymentTransactionDataTypes = {
  [EUDI_PAYMENT_TRANSACTION_DATA_TYPE]: {
    claims: eudiPaymentTransactionDataClaims,
  },
  [EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE]: {
    claims: eudiPaymentsAnimoTransactionDataClaims,
  },
} satisfies Record<
  EudiPaymentTransactionDataType,
  { claims: ScaCredentialMetadata['transaction_data_types'][string]['claims'] }
>

const eudiPaymentUiLabels: NonNullable<ScaCredentialMetadata['transaction_data_types'][string]['ui_labels']> = {
  affirmative_action_label: [{ value: 'Authorize payment' }],
  denial_action_label: [{ value: 'Cancel' }],
  transaction_title: [{ value: 'Review payment' }],
}

export const eudiPaymentScaMetadata: ScaCredentialMetadata = {
  transaction_data_types: {
    [EUDI_PAYMENT_TRANSACTION_DATA_TYPE]: {
      claims: eudiPaymentTransactionDataClaims,
      ui_labels: eudiPaymentUiLabels,
    },
    [EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE]: {
      claims: eudiPaymentsAnimoTransactionDataClaims,
      ui_labels: eudiPaymentUiLabels,
    },
  },
}

export const eudiPaymentScaMatcherConfig = {
  [EUDI_PAYMENT_TRANSACTION_DATA_TYPE]: {
    payee: ['payload', 'payee', 'name'],
    amount: ['payload', 'amount'],
    additional_info: ['payload', 'transaction_id'],
  },
  [EUDI_PAYMENTS_ANIMO_TRANSACTION_DATA_TYPE]: {
    payee: ['payload', 'payee', 'name'],
    amount: ['payload', 'amount'],
    additional_info: ['payload', 'transaction_id'],
  },
}

// Replace this heuristic with the actual Wero credential mapping once the Wero credential type is defined.
export function isEudiPaymentCredentialVct(vcts?: Iterable<string>) {
  if (!vcts) return false

  return Array.from(vcts).some((vct) => vct.toLowerCase().includes('wero'))
}

export function isEudiPaymentTransactionDataType(type: string): type is EudiPaymentTransactionDataType {
  return EUDI_PAYMENT_TRANSACTION_DATA_TYPES.some((paymentType) => paymentType === type)
}

export function computeEudiPaymentIntegrity(input: string) {
  return `sha256-${TypedArrayEncoder.toBase64(Hasher.hash(input, 'sha-256'))}`
}
