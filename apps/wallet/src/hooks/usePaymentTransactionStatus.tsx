import { getPayingActivityCredential } from '@package/app'
import {
  activityStorage,
  type CredentialForDisplay,
  type CredentialRecord,
  fetchPaymentTransactionStatus,
  getTransactionStatusMetadata,
  isPasoTransaction,
  useCredentials,
  useParadym,
} from '@paradym/wallet-sdk'
import type { PaymentActivity } from '@paradym/wallet-sdk/storage/activityStore'
import { useEffect } from 'react'

export function usePaymentTransactionStatus(activity: PaymentActivity | undefined) {
  const { credentials } = useCredentials()
  const { paradym } = useParadym('unlocked')

  useEffect(() => {
    if (!activity || !paradym) return
    if (activity.transactionStatus === 'ACSC' || activity.transactionStatus === 'RJCT') return
    // TS 12 defines the status backchannel; a PaSO payment has nothing to poll.
    if (isPasoTransaction(activity.transaction)) return

    const credentialRecord = getPaymentStatusCard(activity, credentials)
    if (!credentialRecord) return

    let cancelled = false
    fetchPaymentTransactionStatus(credentialRecord, activity.transaction.hash).then(async (next) => {
      if (cancelled || !next) return
      if (next !== activity.transactionStatus) {
        await activityStorage.updateActivity(paradym.agent, activity.id, { transactionStatus: next })
      }
    })

    return () => {
      cancelled = true
    }
  }, [activity, credentials, paradym])
}

/**
 * The record of the card that paid, when it says where to poll the payment's status. Activities stored before
 * the paying card was marked fall back to the shared card that has a status URL.
 */
export function getPaymentStatusCard(activity: PaymentActivity, credentials: CredentialForDisplay[]) {
  const recordOf = (id: string) => credentials.find((credential) => credential.id === id)?.record
  const hasStatus = (record?: CredentialRecord) => !!record && getTransactionStatusMetadata(record) !== null

  const paidWith = getPayingActivityCredential(activity, (activityCredential) =>
    hasStatus(recordOf(activityCredential.id))
  )
  const record = paidWith && recordOf(paidWith.id)
  return hasStatus(record) ? record : undefined
}
