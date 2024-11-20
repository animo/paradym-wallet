import { setFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { trustedX509Certificates } from '@easypid/constants'
import { WalletServiceProviderClient } from '@easypid/crypto/WalletServiceProviderClient'
import { initializeEasyPIDAgent } from '@package/agent'

export async function initializeAppAgent({
  walletKey,
  walletKeyVersion,
  registerWallet,
}: { walletKey: string; walletKeyVersion: number; registerWallet?: boolean }) {
  const agent = await initializeEasyPIDAgent({
    keyDerivation: 'raw',
    walletId: `easypid-wallet-${walletKeyVersion}`,
    walletKey,
    walletLabel: 'EasyPID Wallet',
    trustedX509Certificates,
  })

  /**
   *
   * Setup specific for the Wallet Service provider
   *
   */
  const wsp = new WalletServiceProviderClient(
    process.env.EXPO_PUBLIC_WALLET_SERVICE_PROVIDER_URL ?? 'https://wsp.funke.animo.id',
    agent
  )
  if (registerWallet) {
    await wsp.createSalt()
    await wsp.register()
  }
  setFallbackSecureEnvironment(wsp)

  return agent
}
