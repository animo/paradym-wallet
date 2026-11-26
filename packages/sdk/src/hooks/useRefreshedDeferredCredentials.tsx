import { useEffect, useRef, useState } from 'react'
import { fetchAndProcessDeferredCredentials } from '../openid4vc/deferredCredentialRecord'
import {
  type DeferredCredential,
  getDeferredCredentialNextCheckAt,
  useDeferredCredentials,
} from '../storage/deferredCredentialStore'
import { useParadym } from './useParadym'

/**
 * Fetches the deferred credentials that are due, and again each time the next one is due, for as long as the
 * component is mounted. So a card that becomes ready while the wallet is open is added without the user
 * having to look for it in the inbox.
 *
 * @param onIssued Called with the number of cards that were issued in the meantime.
 */
export const useRefreshedDeferredCredentials = (onIssued?: (count: number) => void) => {
  const { paradym } = useParadym('unlocked')
  const { deferredCredentials, isLoading: isLoadingDeferredCredentials } = useDeferredCredentials()
  // The `lastCheckedAt` each credential was last fetched at. A fetch that fails or still returns pending
  // updates the record and so re-runs this effect, which must not fetch the same credential right away.
  const attempted = useRef(new Map<string, string>())
  // Bumped when the next credential is due, to run the effect again
  const [dueAt, setDueAt] = useState(0)

  useEffect(() => {
    if (isLoadingDeferredCredentials) return

    const now = Date.now()
    const nextCheckAt = (deferredCredential: DeferredCredential) =>
      getDeferredCredentialNextCheckAt(deferredCredential)?.getTime()
    // Without an interval the issuer said nothing about when to retry, so it is fetched once
    const isDue = (deferredCredential: DeferredCredential) => {
      const checkAt = nextCheckAt(deferredCredential)
      if (checkAt === undefined) return !attempted.current.has(deferredCredential.id)
      return checkAt <= now && attempted.current.get(deferredCredential.id) !== deferredCredential.lastCheckedAt
    }

    const due = deferredCredentials.filter(isDue)
    if (due.length) {
      for (const deferredCredential of due) {
        attempted.current.set(deferredCredential.id, deferredCredential.lastCheckedAt)
      }

      paradym.logger.debug('Refreshing deferred credentials')
      fetchAndProcessDeferredCredentials(paradym, due)
        .then((count) => {
          if (count) onIssued?.(count)
        })
        .finally(() => {
          paradym.logger.debug('Finished refreshing deferred credentials')
        })
    }

    const upcoming = deferredCredentials
      .map(nextCheckAt)
      .filter((checkAt): checkAt is number => checkAt !== undefined && checkAt > now)
    if (!upcoming.length) return

    const timeout = setTimeout(() => setDueAt(Date.now()), Math.min(...upcoming) - now)
    return () => clearTimeout(timeout)
  }, [paradym, isLoadingDeferredCredentials, deferredCredentials, onIssued, dueAt])
}
