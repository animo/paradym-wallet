import { agentDependencies } from '@credo-ts/react-native'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { secureWalletKey } from '../secure'
import { getWalletStoreDirectories } from '../storage/walletStore'

export const reset = async (paradym?: ParadymWalletSdk) => {
  paradym?.logger.debug('Resetting wallet')

  await paradym?.agent.shutdown()

  const fs = new agentDependencies.FileSystem()

  // Clear cach and temp path
  if (await fs.exists(fs.cachePath)) await fs.delete(fs.cachePath)
  if (await fs.exists(fs.tempPath)) await fs.delete(fs.tempPath)

  // I think removing triggers the biometrics somehow. We look at the salt
  // to see if the secure unlock has been setup.
  // await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
  await secureWalletKey.removeSalt(secureWalletKey.getWalletKeyVersion())

  if (paradym) {
    // `walletId` is the composed store id, so this covers both the shared container on iOS builds
    // with the digital credentials API config plugin and the app's own data path.
    const walletDirectories = getWalletStoreDirectories(paradym.walletId)

    for (const walletDirectory of walletDirectories) {
      const walletDirectoryExists = await fs.exists(walletDirectory)
      if (walletDirectoryExists) {
        paradym.logger.debug('wallet directory exists, deleting...', { walletDirectory })
        await fs.delete(walletDirectory)
        paradym.logger.debug('wallet directory deleted', { walletDirectory })
      } else {
        paradym.logger.debug('wallet directory does not exist', { walletDirectory })
      }
    }
  }
}
