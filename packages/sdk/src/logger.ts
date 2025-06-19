import { ConsoleLogger, LogLevel } from '@credo-ts/core'

export { LogLevel }

export const logger = (logLevel: LogLevel) => {
  const consoleLogger = new ConsoleLogger(logLevel)

  const originalWarn = consoleLogger.warn

  consoleLogger.warn = (message: string, data?: Record<string, unknown>) => {
    if (message.includes('module is experimental')) return
    originalWarn(message, data)
  }

  return consoleLogger
}
