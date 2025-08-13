import { ConsoleLogger, LogLevel } from '@credo-ts/core'

type LogData = Record<string, unknown>
type LogMessage = { level: LogLevel; message: string; data?: LogData }

export class ParadymWalletLogger extends ConsoleLogger {
  private loggedMessages: LogMessage[] = []
  private loggedMessagesLimit = 0

  public trackLoggedMessages(messageLimit = 1000) {
    this.loggedMessagesLimit = messageLimit
  }

  public resetLoggedMessages() {
    this.loggedMessages = []
  }

  public stopLoggedMessagesTracking() {
    this.loggedMessagesLimit = 0
    this.loggedMessages = []
  }

  public get loggedMessageContents() {
    return JSON.stringify(this.loggedMessages)
  }

  private addToLoggedMessages(level: LogLevel, message: string, data?: LogData) {
    if (this.loggedMessagesLimit === 0) return
    if (this.loggedMessages.length >= this.loggedMessagesLimit) this.loggedMessages.shift()
    this.loggedMessages.push({
      level,
      message,
      data,
    })
  }

  public fatal(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.fatal, message, data)
    super.fatal(message, data)
  }
  public error(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.error, message, data)
    super.error(message, data)
  }
  public warn(message: string, data?: LogData): void {
    if (message.includes('module is experimental')) return
    this.addToLoggedMessages(LogLevel.warn, message, data)
    super.warn(message, data)
  }
  public info(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.info, message, data)
    super.info(message, data)
  }
  public debug(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.debug, message, data)
    super.debug(message, data)
  }
  public trace(message: string, data?: LogData): void {
    this.addToLoggedMessages(LogLevel.trace, message, data)
    super.trace(message, data)
  }
}

export const logger = new ParadymWalletLogger(LogLevel.trace)
logger.trackLoggedMessages()
