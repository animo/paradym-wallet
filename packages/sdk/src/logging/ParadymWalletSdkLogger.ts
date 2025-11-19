import { BaseLogger, LogLevel } from '@credo-ts/core'

export { LogLevel, BaseLogger as ParadymWalletSdkLogger }
export type LogData = Record<string, unknown>
export type LogMessage = { level: LogLevel; message: string; data?: LogData }
