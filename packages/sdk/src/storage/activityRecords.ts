import type { Agent } from '@credo-ts/core'
import { GenericRecord } from '@credo-ts/core'
import type { Activity, ActivityType } from './activityStore'
import { getWalletJsonStore } from './walletJsonStore'

/**
 * One entry per activity, newest first, holding only what the wallet orders and filters on.
 *
 * Activities used to live in a single record holding the whole history, which meant reading all of
 * it to show one entry and rewriting all of it to add one. They are their own records now — but
 * askar can only order a query by record id, and Credo does not pass an ordering through to it at
 * all, so the order has to be kept somewhere. This is that somewhere, and it is deliberately thin:
 * around ninety bytes an activity, against a payload that carries a whole presentation.
 *
 * It can be dropped entirely once Credo can order a query, by making the record ids sort by time.
 */
export type ActivityIndexEntry = {
  id: string
  date: string
  type: ActivityType
  entityId?: string
}

export type ActivityIndex = {
  entries: ActivityIndexEntry[]
}

export const activityIndexStore = getWalletJsonStore<ActivityIndex>('PARADYM_WALLET_ACTIVITY_INDEX')

// Distinct from the index's own record id, which would otherwise parse as an activity called
// 'INDEX' every time it is written.
const activityRecordIdPrefix = 'PARADYM_WALLET_ACTIVITY_ITEM_'

/** The record id an activity is stored under, so an activity id is enough to fetch it. */
export function getActivityRecordId(activityId: string) {
  return `${activityRecordIdPrefix}${activityId}`
}

/** The one cache key an activity is read under, wherever it is read from. */
export function activityQueryKey(activityId: string) {
  return ['paradym-activity', activityId] as const
}

/** The activity a stored record belongs to, or `undefined` when the record is something else. */
export function getActivityIdFromRecordId(recordId: string) {
  if (!recordId.startsWith(activityRecordIdPrefix)) return undefined
  return recordId.slice(activityRecordIdPrefix.length)
}

function toIndexEntry(activity: Activity): ActivityIndexEntry {
  return {
    id: activity.id,
    date: activity.date,
    type: activity.type,
    entityId: activity.entity.id,
  }
}

/** `walletJsonStore.store` saves, which throws once the record is there, so writes go through here. */
async function writeActivityIndex(agent: Agent, entries: ActivityIndexEntry[]) {
  const existing = await agent.genericRecords.findById(activityIndexStore.recordId)

  if (existing) await activityIndexStore.update(agent, { entries })
  else await activityIndexStore.store(agent, { entries })
}

export async function getActivityIndex(agent: Agent): Promise<ActivityIndexEntry[]> {
  const index = await activityIndexStore.get(agent)
  return index?.entries ?? []
}

/**
 * Written whether or not the record is already there, because a migration that was interrupted
 * halfway leaves some of them behind and has to be safe to run again.
 */
async function upsertActivityRecord(agent: Agent, activity: Activity) {
  const id = getActivityRecordId(activity.id)
  const record = new GenericRecord({ id, content: activity as unknown as Record<string, unknown> })

  const existing = await agent.genericRecords.findById(id)
  if (existing) await agent.genericRecords.update(record)
  else await agent.genericRecords.save(record)
}

export async function saveActivityRecord(agent: Agent, activity: Activity) {
  // The record before the index: an index entry pointing at a record that is not there yet would
  // be rendered as a missing activity, while a record no entry points at is merely unreachable.
  await upsertActivityRecord(agent, activity)

  const entries = await getActivityIndex(agent)
  const withoutActivity = entries.filter((entry) => entry.id !== activity.id)

  await writeActivityIndex(
    agent,
    [toIndexEntry(activity), ...withoutActivity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  )
}

export async function updateActivityRecord(agent: Agent, activity: Activity) {
  // Only the payload: nothing an update can change is part of the index entry.
  await upsertActivityRecord(agent, activity)
}

export async function deleteActivityRecord(agent: Agent, activityId: string) {
  const entries = await getActivityIndex(agent)
  await writeActivityIndex(
    agent,
    entries.filter((entry) => entry.id !== activityId)
  )

  const record = await agent.genericRecords.findById(getActivityRecordId(activityId))
  if (record) await agent.genericRecords.deleteById(record.id)
}

export async function getActivityRecordById(agent: Agent, activityId: string): Promise<Activity | undefined> {
  const record = await agent.genericRecords.findById(getActivityRecordId(activityId))
  return record?.content as Activity | undefined
}

export async function getActivityRecordsByIds(agent: Agent, activityIds: string[]): Promise<Activity[]> {
  const activities = await Promise.all(activityIds.map((activityId) => getActivityRecordById(agent, activityId)))
  return activities.filter((activity): activity is Activity => activity !== undefined)
}
