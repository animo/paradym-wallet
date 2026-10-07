import { createMMKV, type MMKV } from 'react-native-mmkv'
import { getSharedMmkvPath } from '../storage/sharedMmkv'

/**
 * The processes that log: the app itself, and the credential request UI the DC API launches — the
 * identity document provider extension on iOS, a separate activity on Android.
 */
export type LogProcess = 'app' | 'dcApi'

/**
 * The slot holding the oldest entry. Always 0 until the buffer is full; after that, also the slot the
 * next entry overwrites.
 */
const oldestSlotKey = 'oldestSlot'

const stores: Partial<Record<LogProcess, MMKV>> = {}

/**
 * Each process's log store: its own MMKV instance, so neither ever writes the other's entries, in
 * the shared container so the app can export what the request UI logged before it went away.
 *
 * `multi-process` because the other process still opens it for reading: the app to export, and the
 * request UI to find its own buffer again after a crash.
 */
function getLogStore(process: LogProcess): MMKV {
  let store = stores[process]
  if (!store) {
    store = createMMKV({ id: `paradym-logs-${process}`, path: getSharedMmkvPath(), mode: 'multi-process' })
    stores[process] = store
  }
  return store
}

/**
 * A ring buffer of serialized log entries that survives the process.
 *
 * Every entry is written the moment it is logged, into one of `limit` fixed slots, overwriting the
 * oldest once the buffer is full. That is what bounds the storage — at most `limit` entries exist,
 * and MMKV compacts its own file as keys are overwritten — and it keeps a write to one small value
 * rather than re-serializing the whole buffer on every log line. MMKV writes into a memory-mapped
 * file, so an entry that was written is still there after a crash, native or JavaScript.
 */
export class PersistedLogBuffer {
  private readonly store: MMKV

  public constructor(
    process: LogProcess,
    private readonly limit: number
  ) {
    this.store = getLogStore(process)
  }

  /**
   * The stored entries in slot order, and the slot holding the oldest — the in-memory buffer of the
   * logger mirrors the slots exactly, so it can pick up where the previous run left off.
   */
  public load(): { entries: string[]; oldestSlot: number } {
    const entries: string[] = []
    for (let slot = 0; slot < this.limit; slot++) {
      const entry = this.store.getString(`${slot}`)
      if (entry === undefined) break
      entries.push(entry)
    }

    // A previous run with a larger limit leaves slots this one never reads or overwrites.
    for (const key of this.store.getAllKeys()) {
      if (key !== oldestSlotKey && Number(key) >= entries.length) this.store.remove(key)
    }

    const oldestSlot = this.store.getNumber(oldestSlotKey) ?? 0
    return { entries, oldestSlot: entries.length === this.limit && oldestSlot < this.limit ? oldestSlot : 0 }
  }

  public write(slot: number, entry: string, oldestSlot: number) {
    this.store.set(`${slot}`, entry)
    this.store.set(oldestSlotKey, oldestSlot)
  }

  public clear() {
    clearPersistedLogs(this.store)
  }
}

function clearPersistedLogs(store: MMKV) {
  store.clearAll()
  // MMKV keeps its file at its largest size until asked to shrink it.
  store.trim()
}

/** Deletes the stored logs of a process, for when the logs should no longer be kept at all. */
export function clearProcessLogs(process: LogProcess) {
  clearPersistedLogs(getLogStore(process))
}

/**
 * Serialized entries from several processes as one JSON array, in the order they were logged.
 *
 * Each process keeps its own buffer, so this is where they meet — by timestamp, since the two ran
 * side by side and neither knows the other's order.
 */
export function mergeLogEntries(...processEntries: string[][]): string {
  const timestamped = processEntries.flat().map((entry) => {
    try {
      return { entry, timestamp: String((JSON.parse(entry) as { timestamp?: unknown }).timestamp ?? '') }
    } catch {
      return { entry, timestamp: '' }
    }
  })

  // ISO 8601 timestamps in UTC sort correctly as strings; the sort is stable, so ties keep their order.
  timestamped.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0))
  return `[${timestamped.map(({ entry }) => entry).join(',')}]`
}

/** The stored log entries of a process, oldest first, as serialized strings. */
export function readProcessLogs(process: LogProcess): string[] {
  const store = getLogStore(process)
  const entries: string[] = []
  for (let slot = 0; ; slot++) {
    const entry = store.getString(`${slot}`)
    if (entry === undefined) break
    entries.push(entry)
  }

  const oldestSlot = store.getNumber(oldestSlotKey) ?? 0
  return [...entries.slice(oldestSlot), ...entries.slice(0, oldestSlot)]
}
