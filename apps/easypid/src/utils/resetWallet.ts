import { agentDependencies } from '@credo-ts/react-native'
import {
  removeHasFinishedOnboarding,
  removeHasSeenIntroTooltip,
} from '@easypid/features/onboarding/hasFinishedOnboarding'
import { type SecureUnlockReturn, secureWalletKey } from '@package/secure-store/secureUnlock'
import { registerDevMenuItems } from 'expo-dev-client'
import { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { type SecureUnlockContext, useSecureUnlock } from '../agent'
import { getWalletId } from '../agent/walletId'
import { removeShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export async function resetWallet(secureUnlock: SecureUnlockReturn<SecureUnlockContext>) {
  console.log('Resetting wallet', secureUnlock.state)

  if (secureUnlock.state === 'unlocked') {
    const agent = secureUnlock.context.agent
    secureUnlock.lock()
    await agent.shutdown()
    await agent.dependencyManager.deleteAgentContext(agent.context)
  }

  const fs = new agentDependencies.FileSystem()

  // Clear cache and temp path
  if (await fs.exists(fs.cachePath)) await fs.delete(fs.cachePath)
  if (await fs.exists(fs.tempPath)) await fs.delete(fs.tempPath)

  const walletId = getWalletId(secureWalletKey.getWalletKeyVersion())
  const walletDirectory = `${fs.dataPath}/wallet/${walletId}`

  const walletDirectoryExists = await fs.exists(walletDirectory)
  if (walletDirectoryExists) {
    console.log('wallet directory exists, deleting')
    await fs.delete(walletDirectory)
  } else {
    console.log('wallet directory does not exist')
  }

  // I think removing triggers the biometrics somehow. We look at the salt
  // to see if the secure unlock has been setup.
  // await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
  await secureWalletKey.removeSalt(secureWalletKey.getWalletKeyVersion())

  removeHasFinishedOnboarding()
  removeHasSeenIntroTooltip()
  removeShouldUseCloudHsm()

  if (secureUnlock.state !== 'initializing') {
    secureUnlock.reinitialize()
  }
}

export function useResetWalletDevMenu() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    registerDevMenuItems([
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
