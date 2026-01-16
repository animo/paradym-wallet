import { agentDependencies } from '@credo-ts/react-native'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { secureWalletKey } from '../secure'

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
    const walletDirectory = `${fs.dataPath}/wallet/${paradym.walletId}`

    const walletDirectoryExists = await fs.exists(walletDirectory)
    if (walletDirectoryExists) {
      paradym.logger.debug('wallet directory exists, deleting')
      await fs.delete(walletDirectory)
    } else {
      paradym.logger.debug('wallet directory does not exist')
    }
  }
}
