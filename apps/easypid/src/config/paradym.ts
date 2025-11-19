import { eudiTrustList, trustedX509Certificates, trustedX509Entities } from '@easypid/constants'
import { LogLevel } from '@paradym/wallet-sdk'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk/ParadymWalletSdk'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: 'easypid-wallet',
  logging: {
    level: LogLevel.debug,
    trace: true,
    traceLimit: 1000,
  },
  openId4VcConfiguration: {
    // TODO: maybe we can remove this because of the trustMechanisms?
    trustedCertificates: trustedX509Certificates as [string, ...string[]],
  },
  trustMechanisms: [
    { trustMechanism: 'eudi_rp_authentication', trustList: eudiTrustList, trustedX509Entities },
    { trustMechanism: 'x509', trustedX509Entities },
    { trustMechanism: 'did' },
  ],
  didcommConfiguration: { label: '' },
}
