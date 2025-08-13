import { trustedX509Certificates } from '@easypid/constants'
import { LogLevel } from '@paradym/wallet-sdk'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk/ParadymWalletSdk'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  logLevel: LogLevel.debug,
  openId4VcConfiguration: {
    trustedCertificates: trustedX509Certificates as [string, ...string[]],
  },
}
