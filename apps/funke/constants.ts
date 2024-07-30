import ExpoConstants from 'expo-constants'

export const FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

const TRUSTED_CERTIFICATES = ExpoConstants.expoConfig?.extra?.trustedCertificates as [string, ...string[]] | undefined

if (!Array.isArray(TRUSTED_CERTIFICATES)) {
  throw new Error('Trusted Certificates provided in the expo config is not an array')
}

export const trustedCertificates = TRUSTED_CERTIFICATES
