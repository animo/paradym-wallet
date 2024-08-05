import { type SecureUnlockReturn, secureWalletKey } from '@package/secure-store/secureUnlock'
import { DevMenu, isDevelopmentBuild } from 'expo-dev-client'
import { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { useSecureUnlock, type SecureUnlockContext } from '../agent'
import { agentDependencies } from '@credo-ts/react-native'

export async function resetWallet(secureUnlock: SecureUnlockReturn<SecureUnlockContext>) {
  if (!isDevelopmentBuild()) return

  try {
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

    await secureWalletKey.removeWalletKey(secureWalletKey.walletKeyVersion)
    await secureWalletKey.removeSalt(secureWalletKey.walletKeyVersion)
    DevSettings.reload('Wallet Reset')
  } catch (error) {
    console.error('error resetting wallet', error)
  }
}

export function useResetWalletDevMenu() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    if (!isDevelopmentBuild()) return
    console.log('register', secureUnlock.state)
    DevMenu.registerDevMenuItems([{ name: 'Reset Wallet', callback: () => resetWallet(secureUnlock) }])
  }, [secureUnlock])
}
