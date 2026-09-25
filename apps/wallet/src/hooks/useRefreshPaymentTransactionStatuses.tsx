import {
  activityStorage,
  fetchPaymentTransactionStatus,
  getTransactionStatusMetadata,
  pasoPaymentTransactionDataType,
  useActivities,
  useCredentials,
  useParadym,
} from '@paradym/wallet-sdk'
import type { PaymentActivity } from '@paradym/wallet-sdk/storage/activityStore'
import { useEffect, useRef } from 'react'

export function useRefreshPaymentTransactionStatuses() {
  const { activities } = useActivities({ filters: { type: 'payment' }, limit: 100 })
  const { credentials } = useCredentials()
  const { paradym } = useParadym('unlocked')
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    if (!paradym) return

    const credentialRecord = credentials.find((c) => getTransactionStatusMetadata(c.record) !== null)?.record
    if (!credentialRecord) return

    // The status backchannel is a TS 12 extension, so a PaSO payment has nothing to poll. Without
    // this it would be polled anyway — against whichever credential happens to carry the metadata,
    // which is not even the card that authorized it.
    const pendingPayments = activities.filter(
      (a): a is PaymentActivity =>
        a.type === 'payment' &&
        a.transaction.type !== pasoPaymentTransactionDataType &&
        a.transactionStatus !== 'ACSC' &&
        a.transactionStatus !== 'RJCT'
    )
    if (pendingPayments.length === 0) return

    hasRunRef.current = true

    for (const activity of pendingPayments) {
      fetchPaymentTransactionStatus(credentialRecord, activity.transaction.hash)
        .then((next) => {
          if (next && next !== activity.transactionStatus) {
            return activityStorage.updateActivity(paradym.agent, activity.id, { transactionStatus: next })
          }
        })
        .catch(() => {})
    }
  }, [activities, credentials, paradym])
}
