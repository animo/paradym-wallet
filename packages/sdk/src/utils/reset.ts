import { agentDependencies } from '@credo-ts/react-native'
import { defaultWalletId, type ParadymWalletSdkLegacyIdsOptions, type ParadymWalletSdkSharedOptions } from '../config'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { secureWalletKey } from '../secure'
import { getWalletStoreDirectories, getWalletStoreId } from '../storage/walletStore'

/**
 * Without `paradym`, the store ids come from `configuration`. Pass the wallet's configuration then, so a
 * store created before the wallet was unlocked (e.g. during an interrupted onboarding) is removed too.
 */
export const reset = async (
  paradym?: ParadymWalletSdk,
  configuration?: Pick<ParadymWalletSdkSharedOptions, 'id'> & ParadymWalletSdkLegacyIdsOptions
) => {
  paradym?.logger.debug('Resetting wallet')

  await paradym?.agent.shutdown()

  const fs = new agentDependencies.FileSystem()

  // Clear cach and temp path
  if (await fs.exists(fs.cachePath)) await fs.delete(fs.cachePath)
  if (await fs.exists(fs.tempPath)) await fs.delete(fs.tempPath)

  // `walletId` is the composed store id, so this covers both the shared container on iOS builds
  // with the digital credentials API config plugin and the app's own data path. Legacy stores go
  // too: a store left under a legacy id would be moved back in on the next unlock.
  const storeIds = paradym
    ? [paradym.walletId, ...paradym.legacyWalletIds]
    : [configuration?.id ?? defaultWalletId, ...(configuration?.legacyIds ?? [])].map((id) => getWalletStoreId(id))

  for (const walletDirectory of storeIds.flatMap(getWalletStoreDirectories)) {
    const walletDirectoryExists = await fs.exists(walletDirectory)
    if (walletDirectoryExists) {
      paradym?.logger.debug('wallet directory exists, deleting...', { walletDirectory })
      await fs.delete(walletDirectory)
      paradym?.logger.debug('wallet directory deleted', { walletDirectory })
    } else {
      paradym?.logger.debug('wallet directory does not exist', { walletDirectory })
    }
  }

  // Removed last: the salt is what marks the wallet as set up, so a reset that fails halfway leaves
  // the wallet locked rather than starting over on top of a store a new PIN can't open.
  //
  // I think removing triggers the biometrics somehow. We look at the salt
  // to see if the secure unlock has been setup.
  // await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
  await secureWalletKey.removeSalt(secureWalletKey.getWalletKeyVersion())
}
