import { isHardwareBoundCredentialConfiguration } from '@app/config/paymentAttestation'
import { walletId } from '@app/config/wallet'
import { eudiTrustList, trustedDidEntities, trustedOpenId4VciIssuerEntities, trustedX509Entities } from '@app/constants'
import { resolveDcApiDisplay } from '@app/utils/dcApiRegisterOptions'
import { resolveAttributeLabel } from '@app/utils/resolveAttributeLabel'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'
// The leaf rather than the barrel: the credential request UI imports this configuration too, and
// the barrel would pull the entire SDK into its bundle.
import { LogLevel } from '@paradym/wallet-sdk/logging/ParadymWalletSdkLogger'
import * as Application from 'expo-application'
import { Platform } from 'react-native'

// Credo logs on every record, message and http operation, with the record or payload itself as
// data — and the console logger serializes that data on every call. At trace level that is the
// wallet's single largest source of work at startup and on every credential read, so only a build
// or a user that asked for the logs pays for them.
//
// Not part of `paradymWalletSdkOptions`: every unlock sets up a new agent, and has to pass the
// setting as it is then. With the value from app start, a wallet that locked in the background came
// back without logging — and, with `persistForExport` off, deleted the logs captured since development
// mode was turned on.
export const getLoggingOptions = (isDevelopmentModeEnabled: boolean | undefined) => {
  const isVerbose = __DEV__ || isDevelopmentModeEnabled === true

  return {
    level: isVerbose ? LogLevel.Trace : LogLevel.Warn,
    persistForExport: isVerbose,
    persistLimit: 1000,
  }
}

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: walletId,
  // Goes into the `wallet_instance_version` claim of every PaSO payment proof, in the
  // `<platform>:<application id>:<version>` shape [PaSO Core] Section 6.1 illustrates.
  walletInstanceVersion: `${Platform.OS}:${Application.applicationId ?? walletId}:${Application.nativeApplicationVersion ?? '0.0.0'}`,
  // The wallet's own naming for well-known claims, in the user's language, for the ones no issuer
  // named. The SDK resolves the credential's own labels first and formats the key when neither says
  // anything.
  resolveAttributeLabel,
  // The picker wording, so the SDK's own issuance flows can register without the app in the middle.
  resolveDcApiDisplay,
  // A payment attestation is the possession factor of Strong Customer Authentication, so its key is
  // created in the secure environment. The secure environment only supports P-256.
  resolveCredentialKeyOptions: ({ credentialConfiguration }) =>
    isHardwareBoundCredentialConfiguration(credentialConfiguration)
      ? { backend: 'secureEnvironment', algorithm: 'ES256' }
      : undefined,
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
