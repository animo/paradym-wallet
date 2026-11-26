import {
  type FormattedTransactionDataPaso,
  type FormattedTransactionDataPaymentSingle,
  isPasoMandateType,
  isPasoTransaction,
} from '@paradym/wallet-sdk'

export type PaymentTransaction = FormattedTransactionDataPaymentSingle | FormattedTransactionDataPaso

/** A TS 12 payment or a PaSO transaction: authorised with a payment card rather than shared. */
export function isPaymentTransaction(transaction?: { type: string }): transaction is PaymentTransaction {
  return transaction?.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1' || isPasoTransaction(transaction)
}

/**
 * What a payment activity authorised: a payment, a mandate, or another PaSO transaction such as a
 * transfer or standing order. They are stored as the same activity type but read differently.
 */
export type PaymentKind = 'payment' | 'mandate' | 'transaction'

export function getPaymentKind(transaction: PaymentTransaction): PaymentKind {
  if (transaction.type !== 'paso_claims') return 'payment'
  return isPasoMandateType(transaction.pasoType) ? 'mandate' : 'transaction'
}

/**
 * The amount and payee of a payment activity: the payment itself, or the one a PaSO mandate or
 * generic transaction embeds. A transaction without an embedded payment has neither.
 */
export function getPaymentSummary(transaction: PaymentTransaction): { amount: string; payee: string } | undefined {
  if (transaction.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1') {
    return { amount: transaction.amount, payee: transaction.payee.name }
  }
  if (transaction.type !== 'paso_claims') return { amount: transaction.amount.value, payee: transaction.payee.value }

  const embedded = transaction.items.find((item) => item.kind === 'payment')
  return embedded && { amount: embedded.payment.amount.value, payee: embedded.payment.payee.value }
}
