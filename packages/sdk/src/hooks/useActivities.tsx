import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useWalletJsonRecord } from '../providers/WalletJsonStoreProvider'
import {
  type ActivityIndex,
  activityIndexStore,
  activityQueryKey,
  getActivityRecordById,
} from '../storage/activityRecords'
import type { Activity, ActivityType } from '../storage/activityStore'
import { useParadym } from './useParadym'

/**
 * How many activities are read when the caller does not say.
 *
 * Every activity is a record of its own, so this is a page rather than the whole history: the index
 * says what the newest ones are, and only those are read.
 */
const defaultActivityLimit = 25

export const useActivities = ({
  filters,
  limit = defaultActivityLimit,
}: {
  filters?: { entityId?: string; type?: ActivityType }
  limit?: number
} = {}) => {
  // Deliberately not asserting an unlocked wallet: this is rendered by screens a deeplink opens,
  // which can be mounted while the wallet locks itself in the background. Asserting there turned a
  // redirect to the unlock screen into a crash. Without a store there are simply no activities.
  const paradym = useParadym()
  const agent = paradym.state === 'unlocked' ? paradym.paradym.agent : undefined

  // The index is small and ordered, so filtering and paging happen here rather than against the
  // store — which cannot order a query anyway.
  const { record, isLoading: isLoadingIndex } = useWalletJsonRecord<ActivityIndex>(activityIndexStore.recordId)

  const { activityIds, total } = useMemo(() => {
    const matching = (record?.entries ?? [])
      .filter((entry) => !filters?.entityId || entry.entityId === filters.entityId)
      .filter((entry) => !filters?.type || entry.type === filters.type)

    return {
      activityIds: matching.slice(0, limit).map((entry) => entry.id),
      total: matching.length,
    }
  }, [record?.entries, filters?.entityId, filters?.type, limit])

  // One query per activity rather than one per list, so the home screen's single activity, a page
  // of the list, the payment refresh and the detail screen all read the same cache entry instead of
  // fetching the same records once each. Kept fresh by {@link ActivityQuerySync} rather than by
  // refetching, since a stored activity only changes when the wallet itself changes it.
  const { activities, isLoading } = useQueries({
    queries: activityIds.map((activityId) => ({
      queryKey: activityQueryKey(activityId),
      queryFn: () => (agent ? getActivityRecordById(agent, activityId) : undefined),
      staleTime: Number.POSITIVE_INFINITY,
      enabled: !!agent && !isLoadingIndex,
    })),
    combine: (results) => ({
      activities: results
        .map((result) => result.data)
        .filter((activity): activity is Activity => activity !== undefined),
      // Only while nothing has resolved. Growing the page adds queries to this list, and reporting
      // that as loading would replace a list the user is already reading with a spinner.
      isLoading: results.length > 0 && results.every((result) => result.isLoading),
    }),
  })

  return {
    activities,
    isLoading: isLoadingIndex || (activityIds.length > 0 && isLoading),

    /** How many activities match, ignoring `limit` — the index knows without reading any of them. */
    total,

    /** Whether raising `limit` would return more. */
    hasMore: total > activityIds.length,
  }
}
