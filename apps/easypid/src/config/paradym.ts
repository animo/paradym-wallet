import { eudiTrustList, trustedX509Certificates, trustedX509Entities } from '@easypid/constants'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'
import { LogLevel } from '@paradym/wallet-sdk'
import { getIsDevelopmentModeEnabled, getIsRelyingPartyVerificationDisabled } from '../hooks/useDevelopmentMode'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: 'easypid-wallet',
  logging: {
    level: LogLevel.trace,
    trace: true,
    traceLimit: 1000,
  },
  openId4VcConfiguration: {
    trustedCertificates: trustedX509Certificates as [string, ...string[]],
    getTrustedCertificatesForVerification: (_agentContext, verificationContext) => {
      if (getIsDevelopmentModeEnabled() && getIsRelyingPartyVerificationDisabled()) {
        return verificationContext.certificateChain.map((certificate) => certificate.toString('pem'))
      }
    },
  },
  trustMechanisms: [
    { trustMechanism: 'eudi_rp_authentication', trustList: eudiTrustList, trustedX509Entities },
    { trustMechanism: 'x509', trustedX509Entities },
    { trustMechanism: 'did' },
  ],
  didcommConfiguration: { label: '' },
}
