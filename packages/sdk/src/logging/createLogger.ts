import type { ParadymWalletSdkLoggingOptions } from '../config'
import { ParadymWalletSdkConsoleLogger } from './ParadymWalletSdkConsoleLogger'
import type { ParadymWalletSdkLogger } from './ParadymWalletSdkLogger'
import { clearProcessLogs, type LogProcess } from './persistedLogs'

/**
 *
 * The logger an agent runs with: the wallet's own when it configured one, a console logger
 * otherwise.
 *
 * Spelled once so the credential request UI logs exactly the way the app does.
 *
 */
export const createLogger = (
  logging: ParadymWalletSdkLoggingOptions | undefined,
  process: LogProcess
): ParadymWalletSdkLogger => {
  const logger = logging?.customLogger
    ? new logging.customLogger(logging.level)
    : new ParadymWalletSdkConsoleLogger(logging?.level)

  if (logging?.persistForExport && logger instanceof ParadymWalletSdkConsoleLogger) {
    logger.trackLoggedMessages(logging.persistLimit, process)
  } else {
    // Nothing is kept for export, so nothing will be written — and nothing written before should linger either.
    clearProcessLogs(process)
  }

  return logger
}
