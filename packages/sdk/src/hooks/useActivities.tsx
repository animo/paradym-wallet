import { useMemo } from 'react'
import { useWalletJsonRecord } from '../providers/WalletJsonStoreProvider'
import { type ActivityRecord, activityStorage } from '../storage/activities'

export const useActivities = ({ filters }: { filters?: { entityId?: string } } = {}) => {
  const { record, isLoading } = useWalletJsonRecord<ActivityRecord>(activityStorage.recordId)

  const activities = useMemo(() => {
    if (!record?.activities) return []

    return [...record.activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((activity) => !filters?.entityId || activity.entity.id === filters?.entityId)
  }, [record?.activities, filters?.entityId])

  return {
    activities,
    isLoading,
  }
}
