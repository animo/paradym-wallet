import { setFallbackSecureEnvironment, shouldUseFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { CURRENT_APP_TYPE } from '@easypid/config/appType'
import { trustedX509Certificates } from '@easypid/constants'
import { WalletServiceProviderClient } from '@easypid/crypto/WalletServiceProviderClient'
import { isFunkeWallet } from '@easypid/hooks/useFeatureFlag'
import { initializeEasyPIDAgent } from '@package/agent'
import { initializeParadymAgent, isEasyPIDAgent } from '@package/agent/src/agent'
import { getShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export async function initializeAppAgent({
  walletKey,
  walletKeyVersion,
  registerWallet,
}: { walletKey: string; walletKeyVersion: number; registerWallet?: boolean }) {
  const agent = isFunkeWallet()
    ? await initializeEasyPIDAgent({
        keyDerivation: 'raw',
        walletId: `easypid-wallet-${walletKeyVersion}`,
        walletKey,
        walletLabel: 'EasyPID Wallet',
        trustedX509Certificates,
      })
    : await initializeParadymAgent({
        keyDerivation: 'raw',
        walletId: 'paradym-wallet-secure',
        walletKey,
        walletLabel: 'paradym-wallet',
        trustedX509Certificates,
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
