import { eudiTrustList, trustedEntityIds, trustedX509Certificates, trustedX509Entities } from '@easypid/constants'
import { LogLevel } from '@paradym/wallet-sdk'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk/ParadymWalletSdk'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: 'easypid-wallet',
  logLevel: LogLevel.debug,
  openId4VcConfiguration: {
    // TODO: maybe we can remove this because of the trustMechanisms?
    trustedCertificates: trustedX509Certificates as [string, ...string[]],
  },
  trustMechanisms: [
    { trustMechanism: 'eudi_rp_authentication', trustList: eudiTrustList, trustedX509Entities },
    { trustMechanism: 'openid_federation', trustedEntityIds },
    { trustMechanism: 'x509', trustedX509Entities },
    { trustMechanism: 'did' },
  ],
}
