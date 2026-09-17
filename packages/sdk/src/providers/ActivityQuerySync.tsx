import {
  type Agent,
  GenericRecord,
  type RecordDeletedEvent,
  type RecordSavedEvent,
  type RecordUpdatedEvent,
  RepositoryEventTypes,
} from '@credo-ts/core'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { activityQueryKey, getActivityIdFromRecordId } from '../storage/activityRecords'

/**
 * Keeps the cached activities in step with the stored ones.
 *
 * Activities are read through one cache entry each and never expire on their own — a stored
 * activity only changes when the wallet changes it, and refetching on a timer would undo the point
 * of sharing the entry between the home screen, the list, the detail screen and the payment
 * refresh. So the store says when to re-read instead, which is also what makes a write from the
 * credential request UI's own process show up here.
 */
export function ActivityQuerySync({ agent }: { agent: Agent }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate = (
      event: RecordSavedEvent<GenericRecord> | RecordUpdatedEvent<GenericRecord> | RecordDeletedEvent<GenericRecord>
    ) => {
      const record = event.payload.record
      if (record.type !== GenericRecord.type) return

      const activityId = getActivityIdFromRecordId(record.id)
      if (!activityId) return

      void queryClient.invalidateQueries({ queryKey: activityQueryKey(activityId) })
    }

    agent.events.on<RecordSavedEvent<GenericRecord>>(RepositoryEventTypes.RecordSaved, invalidate)
    agent.events.on<RecordUpdatedEvent<GenericRecord>>(RepositoryEventTypes.RecordUpdated, invalidate)
    agent.events.on<RecordDeletedEvent<GenericRecord>>(RepositoryEventTypes.RecordDeleted, invalidate)

    return () => {
      agent.events.off(RepositoryEventTypes.RecordSaved, invalidate)
      agent.events.off(RepositoryEventTypes.RecordUpdated, invalidate)
      agent.events.off(RepositoryEventTypes.RecordDeleted, invalidate)
    }
  }, [agent, queryClient])

  return null
}
