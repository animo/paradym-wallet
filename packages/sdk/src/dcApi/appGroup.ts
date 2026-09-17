import { getSharedContainerPath } from '@animo-id/expo-digital-credentials-api'
import { agentDependencies } from '@credo-ts/react-native'
import { Platform } from 'react-native'

/**
 * Path of the container the app shares with the identity document provider extension.
 *
 * The app group itself is configured once, in the digital credentials API config plugin, which
 * writes it into the entitlements and Info.plist of both targets — this only resolves it.
 *
 * Returns `undefined` when there is no shared container: on Android, and on iOS builds made before
 * the config plugin was added.
 */
export function getAppGroupContainerPath(): string | undefined {
  if (Platform.OS !== 'ios') return undefined

  try {
    return getSharedContainerPath()
  } catch {
    return undefined
  }
}

/**
 * Same layout Credo's `ReactNativeFileSystem` uses, so only the base path differs.
 */
export function getAppGroupStoreDirectory(containerPath: string, storeId: string) {
  return `${containerPath}/.afj/wallet/${storeId}`
}

/**
 * Where a store lives when nothing moves it: Credo derives exactly this path when it is given no
 * database config, so it is the real directory on Android and on iOS builds without an app group.
 */
export function getDefaultStoreDirectory(storeId: string) {
  return `${new agentDependencies.FileSystem().dataPath}/wallet/${storeId}`
}
