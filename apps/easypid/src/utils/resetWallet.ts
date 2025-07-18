import { agentDependencies } from '@credo-ts/react-native'
import {
  removeHasFinishedOnboarding,
  removeHasSeenIntroTooltip,
} from '@easypid/features/onboarding/hasFinishedOnboarding'
import { getWalletId } from '@easypid/sdk/paradymWalletSdk'
import { type SecureUnlockReturn, secureWalletKey } from '@package/secure-store/secureUnlock'
import type { BaseAgent } from '@paradym/wallet-sdk/agent'
import { useSecureUnlock } from '@paradym/wallet-sdk/hooks'
import { useParadym } from '@paradym/wallet-sdk/providers/ParadymWalletSdkProvider'
import { isDevelopmentBuild, registerDevMenuItems } from 'expo-dev-client'
import { useEffect } from 'react'
import { DevSettings } from 'react-native'
import { removeShouldUseCloudHsm } from '../features/onboarding/useShouldUseCloudHsm'

export async function resetWallet(secureUnlock: SecureUnlockReturn, agent: BaseAgent) {
  agent.config.logger.info(`Resetting wallet with secure unlock state: ${secureUnlock.state}`)

  if (secureUnlock.state === 'unlocked') {
    secureUnlock.lock()
    await agent.wallet.delete()
    await agent.shutdown()
  }

  const fs = new agentDependencies.FileSystem()

  // Clear cach and temp path
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
  const paradym = useParadym()
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    if (!isDevelopmentBuild()) return
    registerDevMenuItems([
      {
        name: 'Reset Wallet',
        callback: () =>
          // TODO(sdk): move this to the sdk
          resetWallet(secureUnlock, paradym.agent)
            .then(() => DevSettings.reload('Wallet Reset'))
            .catch((error) => console.error('error resetting wallet', error)),
      },
    ])
  }, [secureUnlock, paradym.agent])
}
