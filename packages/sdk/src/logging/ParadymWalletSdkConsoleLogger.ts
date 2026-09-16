import { ConsoleLogger, replaceError } from '@credo-ts/core'
import { type LogData, LogLevel, type LogMessage } from './ParadymWalletSdkLogger'

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

  public trackLoggedMessages(messageLimit = 1000) {
    this.loggedMessagesLimit = messageLimit
    this.resetLoggedMessages()
  }

  public resetLoggedMessages() {
    this.loggedMessages = []
    this.loggedMessagesStart = 0
  }

  public stopLoggedMessagesTracking() {
    this.loggedMessagesLimit = 0
    this.resetLoggedMessages()
  }

  public get loggedMessageContents() {
    // Oldest first, matching the order the messages were logged in.
    const ordered = [
      ...this.loggedMessages.slice(this.loggedMessagesStart),
      ...this.loggedMessages.slice(0, this.loggedMessagesStart),
    ]

    return `[${ordered.join(',')}]`
  }

  private addToLoggedMessages(level: LogLevel, message: string, data?: LogData) {
    if (this.loggedMessagesLimit === 0) return
    // The level check `ConsoleLogger` does before writing to the console, so a message the wallet
    // is not logging is not serialized for the trace buffer either.
    if (!this.isEnabled(level)) return

    const serialized = JSON.stringify({ level, message, data } satisfies LogMessage, replaceError)

    // Overwrite the oldest entry once the buffer is full, rather than shifting every element down.
    if (this.loggedMessages.length < this.loggedMessagesLimit) {
      this.loggedMessages.push(serialized)
      return
    }

    this.loggedMessages[this.loggedMessagesStart] = serialized
    this.loggedMessagesStart = (this.loggedMessagesStart + 1) % this.loggedMessagesLimit
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
