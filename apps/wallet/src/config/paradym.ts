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
  // Reader authentication on an ISO 18013-7 Annex C (`org-iso-mdoc`) request only reaches this
  // callback — the x509 module callback above is never consulted for it, and without an answer here
  // the reader chain would be validated against the issuer roots in `trustMechanisms` and rejected.
  //
  // Every reader is trusted on the certificate it presented itself, matching what the callback above
  // does for credentials: the chain is still verified and the certificate still has to be valid, but
  // it does not have to lead to a root the wallet knows. Who is asking is established separately, from
  // the same chain, and shown in the request UI for the user to decide on.
  getTrustedIssuersForVerification: async (_agentContext, { signer, verification }) => {
    if (verification.type !== 'mdocReaderAuth' || signer.method !== 'x509') return undefined

    const leafCertificate = signer.certificateChain[0]
    if (!leafCertificate) return undefined

    return { trustedIssuers: [{ method: 'x509', issuance: [leafCertificate.toString('pem')] }] }
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
