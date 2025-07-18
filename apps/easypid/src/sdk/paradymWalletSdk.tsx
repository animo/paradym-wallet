import { setFallbackSecureEnvironment, shouldUseFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { trustedX509Certificates } from '@easypid/constants'
import { WalletServiceProviderClient } from '@easypid/crypto/WalletServiceProviderClient'
import { getShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import { isFunkeWallet } from '@easypid/hooks/useFeatureFlag'
import { ParadymWalletSdk } from '@paradym/wallet-sdk'

let paradym: ParadymWalletSdk | undefined

export function getWalletId(walletKeyVersion: number) {
  return isFunkeWallet() ? `easypid-wallet-${walletKeyVersion}` : `paradym-wallet-${walletKeyVersion}`
}

export const paradymWalletSdk = () => {
  if (!paradym) {
    throw new Error('Paradym Wallet Sdk is not yet created. Call `initializeParadymWalletSdk()` first')
  }

  if (!paradym.agent.isInitialized) {
    throw new Error(
      'Paradym Wallet Sdk is not yet initialized. Something went wrong while calling `initializeParadymWalletSdk()`'
    )
  }

  return paradym
}

export const isParadymWalletSdkInitialized = () => {
  if (paradym?.agent.isInitialized) return true
  return false
}

export const shutdownParadymWalletSdk = async () => {
  await paradym?.shutdown()
  paradym = undefined
}

export const initializeParadymWalletSdk = async ({
  walletKeyVersion,
  registerWallet,
  walletKey,
}: {
  walletKey: string
  walletKeyVersion: number
  registerWallet?: boolean
}): Promise<ParadymWalletSdk> => {
  if (paradym?.agent.isInitialized) return paradym

  const walletId = getWalletId(walletKeyVersion)

  paradym = new ParadymWalletSdk({
    id: walletId,
    key: walletKey,
    didcommConfiguration: { label: isFunkeWallet() ? 'EeasyPID Wallet' : 'Paradym Wallet' },
    openId4VcConfiguration: {
      trustedCertificates: trustedX509Certificates as [string, ...string[]],
    },
  })

  await paradym.initialize()

  /**
   *
   * Setup specific for the Wallet Service provider
   *
   */
  if (isFunkeWallet()) {
    const wsp = new WalletServiceProviderClient(
      process.env.EXPO_PUBLIC_WALLET_SERVICE_PROVIDER_URL ?? 'https://wsp.funke.animo.id',
      paradym.agent
    )
    if (registerWallet) {
      await wsp.createSalt()
      await wsp.register()
    }

    const shouldUseCloudHsm = getShouldUseCloudHsm()
    if (shouldUseCloudHsm) shouldUseFallbackSecureEnvironment(true)
    setFallbackSecureEnvironment(wsp)
  }

  return paradym
}
