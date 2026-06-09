import {
  eudiTrustList,
  trustedDidEntities,
  trustedOpenId4VciIssuerEntities,
  trustedX509Certificates,
  trustedX509Entities,
} from '@easypid/constants'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'
import { LogLevel } from '@paradym/wallet-sdk'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: 'easypid-wallet',
  logging: {
    level: LogLevel.trace,
    trace: true,
    traceLimit: 1000,
  },
  openId4VcConfiguration: {
    trustedCertificates: trustedX509Certificates as [string, ...string[]],
    getTrustedCertificatesForVerification: (_agentContext, { certificateChain, verification }) => {
      if (verification.type === 'credential') {
        return [certificateChain[certificateChain.length - 1].toString('pem')]
      }

      // Allow any actor for auth requests for now
      if (verification.type === 'oauth2SecuredAuthorizationRequest') {
        return [certificateChain[certificateChain.length - 1].toString('pem')]
      }

      return undefined
    },
  },
  trustMechanisms: [
    { trustMechanism: 'eudi_rp_authentication', trustList: eudiTrustList, trustedX509Entities },
    { trustMechanism: 'x509', trustedX509Entities },
    { trustMechanism: 'did', trustedDidEntities },
    { trustMechanism: 'none', trustedEntities: trustedOpenId4VciIssuerEntities },
  ],
  didcommConfiguration: { label: '' },
}
