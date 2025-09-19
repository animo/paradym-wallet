import { setFallbackSecureEnvironment, shouldUseFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { AskarStoreInvalidKeyError } from '@credo-ts/askar/build/error/AskarStoreInvalidKeyError'
import { trustedX509Certificates } from '@easypid/constants'
import { WalletServiceProviderClient } from '@easypid/crypto/WalletServiceProviderClient'
import { isFunkeWallet } from '@easypid/hooks/useFeatureFlag'
import { initializeEasyPIDAgent, initializeParadymAgent, isEasyPIDAgent } from '@package/agent'
import { InvalidPinError } from '../crypto/error'
import { getShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export function getWalletId(walletKeyVersion: number) {
  return isFunkeWallet() ? `easypid-wallet-${walletKeyVersion}` : `paradym-wallet-${walletKeyVersion}`
}

export async function initializeAppAgent({
  walletKey,
  walletKeyVersion,
  registerWallet,
}: { walletKey: string; walletKeyVersion: number; registerWallet?: boolean }) {
  const agent = isFunkeWallet()
    ? await initializeEasyPIDAgent({
        keyDerivation: 'raw',
        walletId: getWalletId(walletKeyVersion),
        walletKey,
        walletLabel: 'EasyPID Wallet',
        trustedX509Certificates,
      }).catch((error) => {
        if (error instanceof AskarStoreInvalidKeyError) throw new InvalidPinError()
        throw error
      })
    : await initializeParadymAgent({
        keyDerivation: 'raw',
        walletId: getWalletId(walletKeyVersion),
        walletKey,
        walletLabel: 'Paradym Wallet',
        trustedX509Certificates,
      }).catch((error) => {
        if (error instanceof AskarStoreInvalidKeyError) throw new InvalidPinError()
        throw error
      })

  /**
   *
   * Setup specific for the Wallet Service provider
   *
   */
  if (isEasyPIDAgent(agent)) {
    const wsp = new WalletServiceProviderClient(
      process.env.EXPO_PUBLIC_WALLET_SERVICE_PROVIDER_URL ?? 'https://wsp.funke.animo.id',
      agent
    )
    if (registerWallet) {
      await wsp.createSalt()
      await wsp.register()
    }

    const shouldUseCloudHsm = getShouldUseCloudHsm()
    if (shouldUseCloudHsm) shouldUseFallbackSecureEnvironment(true)
    setFallbackSecureEnvironment(wsp)
  }

  return agent
}
