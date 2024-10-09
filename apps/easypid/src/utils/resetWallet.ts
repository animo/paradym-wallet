import { agentDependencies } from '@credo-ts/react-native'
import { type SecureUnlockReturn, secureWalletKey } from '@package/secure-store/secureUnlock'
import { DevMenu, isDevelopmentBuild } from 'expo-dev-client'
import { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { type SecureUnlockContext, useSecureUnlock } from '../agent'

import {
  removeHasFinishedOnboarding,
  removeHasSeenIntroTooltip,
} from '@easypid/features/onboarding/hasFinishedOnboarding'

export async function resetWallet(secureUnlock: SecureUnlockReturn<SecureUnlockContext>) {
  if (secureUnlock.state === 'unlocked') {
    const agent = secureUnlock.context.agent
    secureUnlock.lock()
    await agent.wallet.delete()
    await agent.shutdown()
  }

  const fs = new agentDependencies.FileSystem()
  if (await fs.exists(fs.cachePath)) await fs.delete(fs.cachePath)
  if (await fs.exists(fs.dataPath)) await fs.delete(fs.dataPath)
  if (await fs.exists(fs.tempPath)) await fs.delete(fs.tempPath)

  // I think removing triggers the biometrics somehow, but we increase the version
  // await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
  // await secureWalletKey.removeSalt(secureWalletKey.getWalletKeyVersion())

  // Update wallet key version
  const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
  secureWalletKey.setWalletKeyVersion(walletKeyVersion + 1)

  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()

  if (secureUnlock.state !== 'initializing') {
    secureUnlock.reinitialize()
  }
}

export function useResetWalletDevMenu() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    if (!isDevelopmentBuild()) return
    DevMenu.registerDevMenuItems([
      {
        name: 'Reset Wallet',
        callback: () =>
          resetWallet(secureUnlock)
            .then(() => DevSettings.reload('Wallet Reset'))
            .catch((error) => console.error('error resetting wallet', error)),
      },
    ])
  }, [secureUnlock])
}
