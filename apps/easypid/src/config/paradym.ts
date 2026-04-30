import { eudiTrustList, trustedX509Certificates, trustedX509Entities } from '@easypid/constants'
import type { SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk'
import { LogLevel } from '@paradym/wallet-sdk'
import * as Application from 'expo-application'
import { Platform } from 'react-native'
import { getIsDevelopmentModeEnabled, getIsRelyingPartyVerificationDisabled } from '../hooks/useDevelopmentMode'

const walletInstanceVersion = `${Platform.OS}:${Application.applicationId ?? 'unknown'}:${
  Application.nativeApplicationVersion ?? Application.nativeBuildVersion ?? 'unknown'
}`

export const paradymWalletSdkOptions: SetupParadymWalletSdkOptions = {
  id: 'easypid-wallet',
  walletInstanceVersion,
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
