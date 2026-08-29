import { walletId } from '@app/config/wallet'
import { eudiTrustList, trustedDidEntities, trustedOpenId4VciIssuerEntities, trustedX509Entities } from '@app/constants'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'
// The leaf rather than the barrel: the credential request UI imports this configuration too, and
// the barrel would pull the entire SDK into its bundle.
import { LogLevel } from '@paradym/wallet-sdk/logging/ParadymWalletSdkLogger'

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: walletId,
  logging: {
    level: LogLevel.Trace,
    trace: true,
    traceLimit: 1000,
  },
  openId4VcConfiguration: {
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
    {
      walletTrustedEntity: {
        organizationName: 'Paradym Wallet',
        entityId: '__',
        logoUri: require('../../assets/paradym/icon.png'),
        uri: 'https://paradym.id',
      },
    },
  ],
  didcommConfiguration: { label: '' },
}
