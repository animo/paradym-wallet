import { ParadymWalletSdkConsoleLogger } from '@paradym/wallet-sdk/logging/ParadymWalletSdkConsoleLogger'
import { LogLevel } from '@paradym/wallet-sdk/logging/ParadymWalletSdkLogger'

export const logger = new ParadymWalletSdkConsoleLogger(LogLevel.Trace)
