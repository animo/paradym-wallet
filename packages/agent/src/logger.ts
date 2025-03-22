import type { LogLevel } from '@credo-ts/core'

import { ConsoleLogger } from '@credo-ts/core'

// Simple logger that disables the experimental module as it can get quite annoying with hot reloading
export const appLogger = (logLevel: LogLevel) => {
  const consoleLogger = new ConsoleLogger(logLevel)

  consoleLogger.warn = (message: string, data?: Record<string, unknown>) => {
    if (message.includes('module is experimental')) return
    consoleLogger.warn(message, data)
  }

  return consoleLogger
}
