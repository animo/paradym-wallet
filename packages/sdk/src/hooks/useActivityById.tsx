import { useQuery } from '@tanstack/react-query'
import { activityQueryKey, getActivityRecordById } from '../storage/activityRecords'
import { useParadym } from './useParadym'

export const useActivityById = (id: string) => {
  // Not asserting an unlocked wallet, for the reason spelled out in `useActivities`.
  const paradym = useParadym()
  const agent = paradym.state === 'unlocked' ? paradym.paradym.agent : undefined

  // The same key the lists read under, so opening an activity that is already on screen is a cache
  // hit rather than another read.
  const { data, isLoading } = useQuery({
    queryKey: activityQueryKey(id),
    queryFn: () => (agent ? getActivityRecordById(agent, id) : undefined),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!agent,
  })

  return {
    isLoading,
    activity: data,
  }
}
