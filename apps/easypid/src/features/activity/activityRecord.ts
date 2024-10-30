import { utils } from '@credo-ts/core'
import { type DisplayImage, type EasyPIDAppAgent, getWalletJsonStore, useWalletJsonRecord } from '@package/agent'
import { getHostNameFromUrl } from 'packages/utils/src'
import { useMemo } from 'react'

export type ActivityType = 'shared' | 'received'
export type ActivityStatus = 'success' | 'failed' | 'stopped'
export type SharingFailureReason = 'missing_credentials' | 'unknown'

interface BaseActivity {
  id: string
  type: ActivityType
  status: ActivityStatus
  date: string
  entity: {
    did: string
    host?: string
    name?: string
    logo?: DisplayImage
    backgroundColor?: string
  }
}

interface PresentationActivity extends BaseActivity {
  type: 'shared'
  request: {
    credentials: Array<{
      id: string
      disclosedAttributes: string[]
      disclosedPayload: Record<string, unknown>
    }>
    name?: string
    purpose?: string
    failureReason?: SharingFailureReason
  }
}

interface IssuanceActivity extends BaseActivity {
  type: 'received'
  credentialIds: string[]
}

export type Activity = PresentationActivity | IssuanceActivity

interface ActivityRecord {
  activities: Activity[]
}

const _activityStorage = getWalletJsonStore<ActivityRecord>('EASYPID_ACTIVITY_RECORD')
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

export const useActivities = ({ filters }: { filters?: { did?: string } } = {}) => {
  const { record, isLoading } = useWalletJsonRecord<ActivityRecord>(activityStorage.recordId)

  const activities = useMemo(() => {
    if (!record?.activities) return []

    return [...record.activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((activity) => {
        if (filters?.did) return activity.entity.did === filters.did
        return true
      })
  }, [record?.activities, filters?.did])

  return {
    activities,
    isLoading,
  }
}

export const addReceivedActivity = async (
  agent: EasyPIDAppAgent,
  input: {
    did: string
    name: string
    domain?: string
    logo?: DisplayImage
    backgroundColor?: string
    credentialIds: string[]
  }
) => {
  await activityStorage.addActivity(agent, {
    id: utils.uuid(),
    date: new Date().toISOString(),
    type: 'received',
    status: 'success',
    entity: {
      did: input.did,
      name: input.name,
      host: input.domain ? input.domain : (getHostNameFromUrl(input.did) as string),
      logo: input.logo,
      backgroundColor: input.backgroundColor,
    },
    credentialIds: input.credentialIds,
  } as IssuanceActivity)
}

export const addSharedActivity = async (
  agent: EasyPIDAppAgent,
  input: {
    status: ActivityStatus
    entity: {
      did: string
      name?: string
      logo?: DisplayImage
    }
    request: {
      credentials: Array<{
        id: string
        disclosedAttributes: string[]
        disclosedPayload: Record<string, unknown>
      }>
      name?: string
      purpose?: string
      failureReason?: SharingFailureReason
    }
  }
) => {
  await activityStorage.addActivity(agent, {
    id: utils.uuid(),
    date: new Date().toISOString(),
    type: 'shared',
    status: input.status,
    entity: {
      did: input.entity.did,
      name: input.entity.name,
      host: getHostNameFromUrl(input.entity.did) as string,
      logo: input.entity.logo,
    },
    request: {
      name: input.request.name,
      purpose: input.request.purpose,
      credentials: input.request.credentials,
      failureReason: input.request.failureReason,
    },
  } as PresentationActivity)
}
