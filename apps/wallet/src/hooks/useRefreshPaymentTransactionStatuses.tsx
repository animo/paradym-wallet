import {
  activityStorage,
  fetchPaymentTransactionStatus,
  isPasoTransaction,
  useActivities,
  useCredentials,
  useParadym,
} from '@paradym/wallet-sdk'
import type { PaymentActivity } from '@paradym/wallet-sdk/storage/activityStore'
import { useEffect, useRef } from 'react'
import { getPaymentStatusCard } from './usePaymentTransactionStatus'

export function useRefreshPaymentTransactionStatuses() {
  const { activities } = useActivities({ filters: { type: 'payment' }, limit: 100 })
  const { credentials } = useCredentials()
  const { paradym } = useParadym('unlocked')
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    if (!paradym) return

    // The status backchannel is a TS 12 extension, so a PaSO payment has nothing to poll.
    const pendingPayments = activities.filter(
      (a): a is PaymentActivity =>
        a.type === 'payment' &&
        !isPasoTransaction(a.transaction) &&
        a.transactionStatus !== 'ACSC' &&
        a.transactionStatus !== 'RJCT'
    )
    // Each payment is polled at the card that paid it, which may still be loading
    const polls = pendingPayments.flatMap((activity) => {
      const credentialRecord = getPaymentStatusCard(activity, credentials)
      return credentialRecord ? [{ activity, credentialRecord }] : []
    })
    if (polls.length === 0) return

    hasRunRef.current = true

    for (const { activity, credentialRecord } of polls) {
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
