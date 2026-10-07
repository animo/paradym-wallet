import { ConsoleLogger, replaceError } from '@credo-ts/core'
import { type LogData, LogLevel, type LogMessage } from './ParadymWalletSdkLogger'
import { type LogProcess, PersistedLogBuffer } from './persistedLogs'

export class ParadymWalletSdkConsoleLogger extends ConsoleLogger {
  /**
   * Ring buffer of already-serialized `LogMessage` objects.
   *
   * Serialized rather than kept as objects so no class/agent reference is retained, and stored as
   * the string the export concatenates so each message is serialized exactly once. Credo logs on
   * every record and message operation, with the record itself as data — round-tripping that
   * through `JSON.parse(JSON.stringify(...))` on every call is what used to dominate the cost of
   * logging.
   */
  private loggedMessages: string[] = []
  private loggedMessagesStart = 0
  private loggedMessagesLimit = 0
  private persistedLogs?: PersistedLogBuffer

  /**
   * Starts keeping the last `messageLimit` messages for export.
   *
   * With a `persistAs` process they are also written to that process's store as they are logged, and
   * whatever a previous run left there is picked up again — so logs from before a crash can still be
   * exported.
   */
  public trackLoggedMessages(messageLimit = 1000, persistAs?: LogProcess) {
    this.loggedMessagesLimit = messageLimit
    this.persistedLogs = persistAs ? new PersistedLogBuffer(persistAs, messageLimit) : undefined

    if (!this.persistedLogs) {
      this.resetLoggedMessages()
      return
    }

    const { entries, oldestSlot } = this.persistedLogs.load()
    this.loggedMessages = entries
    this.loggedMessagesStart = oldestSlot
  }

  public resetLoggedMessages() {
    this.loggedMessages = []
    this.loggedMessagesStart = 0
    this.persistedLogs?.clear()
  }

  /** Stops keeping messages, and deletes the ones kept so far, persisted ones included. */
  public stopLoggedMessagesTracking() {
    this.loggedMessagesLimit = 0
    this.resetLoggedMessages()
    this.persistedLogs = undefined
  }

  /** The kept messages as serialized entries, oldest first, matching the order they were logged in. */
  public get loggedMessageEntries() {
    return [
      ...this.loggedMessages.slice(this.loggedMessagesStart),
      ...this.loggedMessages.slice(0, this.loggedMessagesStart),
    ]
  }

  public get loggedMessageContents() {
    return `[${this.loggedMessageEntries.join(',')}]`
  }

  private addToLoggedMessages(level: LogLevel, message: string, data?: LogData) {
    if (this.loggedMessagesLimit === 0) return
    // The level check `ConsoleLogger` does before writing to the console, so a message the wallet
    // is not logging is not serialized for the trace buffer either.
    if (!this.isEnabled(level)) return

    const timestamp = new Date().toISOString()
    const serialized = JSON.stringify({ timestamp, level, message, data } satisfies LogMessage, replaceError)

    // Overwrite the oldest entry once the buffer is full, rather than shifting every element down.
    let slot: number
    if (this.loggedMessages.length < this.loggedMessagesLimit) {
      slot = this.loggedMessages.length
      this.loggedMessages.push(serialized)
    } else {
      slot = this.loggedMessagesStart
      this.loggedMessages[slot] = serialized
      this.loggedMessagesStart = (this.loggedMessagesStart + 1) % this.loggedMessagesLimit
    }

    this.persistedLogs?.write(slot, serialized, this.loggedMessagesStart)
  }

  public fatal(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.Fatal, message, data)
    super.fatal(message, data)
  }
  public error(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.Error, message, data)

    // FIXME: the error logger in React Native 0.81 changed, and it does not log the error correctly anymore
    // We print the data separately, and the message as error (to get nice stack)
    if (data && this.isEnabled(LogLevel.Error)) {
      console.log(JSON.stringify(data, replaceError, 2))
    }
    super.error(message)
  }
  public warn(message: string, data?: LogData): void {
    if (message.includes('module is experimental')) return
    this.addToLoggedMessages(LogLevel.Warn, message, data)
    super.warn(message, data)
  }
  public info(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.Info, message, data)
    super.info(message, data)
  }
  public debug(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.Debug, message, data)
    super.debug(message)
  }
  public trace(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.Trace, message, data)
    super.trace(message, data)
  }
}
