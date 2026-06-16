import {
  activityStorage,
  fetchPaymentTransactionStatus,
  getTransactionStatusMetadata,
  useActivities,
  useCredentials,
  useParadym,
} from '@paradym/wallet-sdk'
import type { PaymentActivity } from '@paradym/wallet-sdk/storage/activityStore'
import { useEffect, useRef } from 'react'

export function useRefreshPaymentTransactionStatuses() {
  const { activities } = useActivities()
  const { credentials } = useCredentials()
  const { paradym } = useParadym('unlocked')
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    if (!paradym) return

    const credentialRecord = credentials.find((c) => getTransactionStatusMetadata(c.record) !== null)?.record
    if (!credentialRecord) return

    const pendingPayments = activities.filter(
      (a): a is PaymentActivity =>
        a.type === 'payment' && a.transactionStatus !== 'ACSC' && a.transactionStatus !== 'RJCT'
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
