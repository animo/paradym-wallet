import {
  activityStorage,
  fetchPaymentTransactionStatus,
  getTransactionStatusMetadata,
  pasoPaymentTransactionDataType,
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
    if (activity.transaction.type === pasoPaymentTransactionDataType) return

    const credentialRecord = credentials.find((c) => getTransactionStatusMetadata(c.record) !== null)?.record
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
