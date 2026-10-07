import { BaseLogger, LogLevel } from '@credo-ts/core'

export { BaseLogger as ParadymWalletSdkLogger, LogLevel }
export type LogData = Record<string, unknown>
export type LogMessage = { timestamp: string; level: LogLevel; message: string; data?: LogData }
