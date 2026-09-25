import type { ParadymWalletSdkLoggingOptions } from '../config'
import { ParadymWalletSdkConsoleLogger } from './ParadymWalletSdkConsoleLogger'
import type { ParadymWalletSdkLogger } from './ParadymWalletSdkLogger'

/**
 *
 * The logger an agent runs with: the wallet's own when it configured one, a console logger
 * otherwise.
 *
 * Spelled once so the credential request UI logs exactly the way the app does.
 *
 */
export const createLogger = (logging?: ParadymWalletSdkLoggingOptions): ParadymWalletSdkLogger => {
  const logger = logging?.customLogger
    ? new logging.customLogger(logging.level)
    : new ParadymWalletSdkConsoleLogger(logging?.level)

  if (logging?.trace && logger instanceof ParadymWalletSdkConsoleLogger) {
    logger.trackLoggedMessages(logging.traceLimit)
  }

  return logger
}
