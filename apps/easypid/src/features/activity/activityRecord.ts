import { type EasyPIDAppAgent, getWalletJsonStore, useWalletJsonRecord } from '@package/agent'
import { useMemo } from 'react'

interface Activity {
  id: string
  type: 'shared' | 'received'
  date: string

  disclosedPayload?: Record<string, unknown>

  // host of the entity interacted with
  // e.g. funke.animo.id
  entityHost: string

  // name of the entity interacted with
  // e.g. Animo Solutions
  entityName?: string
}

interface ActivityRecord {
  activities: Activity[]
}

const _activityStorage = getWalletJsonStore<ActivityRecord>('EASYPID_WALLET_ACTIVITY_RECORD')
export const activityStorage = {
  recordId: _activityStorage.recordId,
  addActivity: async (agent: EasyPIDAppAgent, activity: Activity) => {
    // get activity. then add this activity
    const record = await _activityStorage.get(agent)
    if (!record) {
      await _activityStorage.store(agent, {
        activities: [activity],
      })
    } else {
      record.activities.push(activity)
      await _activityStorage.update(agent, record)
    }
  },
}

export const useActivities = () => {
  const { record, isLoading } = useWalletJsonRecord<ActivityRecord>(activityStorage.recordId)

  const activities = useMemo(() => {
    if (!record?.activities) return []

    return [...record.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [record?.activities])

  return {
    activities,
    isLoading,
  }
}
