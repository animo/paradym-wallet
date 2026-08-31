import { agentDependencies } from '@credo-ts/react-native'
import { getAppGroupContainerPath, getAppGroupStoreDirectory, getDefaultStoreDirectory } from '../dcApi/appGroup'
import type { ParadymWalletSdkLogger } from '../logging'
import { getWalletKeyVersion } from './sharedMmkv'

const storeFileNames = ['sqlite.db', 'sqlite.db-wal', 'sqlite.db-shm']

/**
 * The on-disk askar store id, `<base id>-<wallet key version>`.
 *
 * The base id is the wallet's own — it determines the store id of existing installs, so it can
 * never change. The version namespaces it, and comes from the settings the app and the credential
 * request UI share.
 *
 * Compose it exactly once per store: this is the only place `<id>-<version>` is spelled.
 */
export function getWalletStoreId(baseId: string, version: number = getWalletKeyVersion()) {
  return `${baseId}-${version}`
}

/**
 * Directory the store's files live in.
 *
 * The container shared with the identity document provider extension on iOS builds made with the
 * digital credentials API config plugin, and Credo's own data path everywhere else — Android
 * included, where there is no shared container to move anything into.
 */
export function getWalletStoreDirectory(storeId: string) {
  const containerPath = getAppGroupContainerPath()

  return containerPath ? getAppGroupStoreDirectory(containerPath, storeId) : getDefaultStoreDirectory(storeId)
}

/**
 * Every directory the store could be in, for cleaning up after it.
 *
 * Both are listed rather than just {@link getWalletStoreDirectory}, because a reset can happen
 * right after a move into the shared container failed halfway through.
 */
export function getWalletStoreDirectories(storeId: string) {
  const containerPath = getAppGroupContainerPath()

  return [
    getDefaultStoreDirectory(storeId),
    ...(containerPath ? [getAppGroupStoreDirectory(containerPath, storeId)] : []),
  ]
}

/**
 * The path askar has to be told about, or `undefined` when Credo already derives the right one.
 *
 * Only the shared container is somewhere Credo would not look by itself; anywhere else the store
 * is opened with no database config at all, which is what keeps
 * {@link walletStoreExists} and the store that gets opened from ever disagreeing.
 */
export function getWalletStorePath(storeId: string) {
  if (!getAppGroupContainerPath()) return undefined

  return `${getWalletStoreDirectory(storeId)}/sqlite.db`
}

/**
 * The askar `store.database` config for a path, and nothing at all without one — spelled here so
 * every agent in the wallet configures its store the same way.
 */
export function getWalletStoreDatabaseConfig(storePath?: string) {
  return storePath ? { database: { type: 'sqlite' as const, config: { path: storePath } } } : {}
}

/**
 * Whether the store has been created, wherever it lives.
 *
 * Worth checking before opening one from the credential request UI: Credo *provisions* a store it
 * cannot find, which would quietly create an empty one keyed to whatever PIN was entered — and on
 * iOS the app would then skip migrating its real store into the shared container, because it would
 * find one already there.
 */
export function walletStoreExists(storeId: string) {
  return new agentDependencies.FileSystem().exists(`${getWalletStoreDirectory(storeId)}/sqlite.db`)
}

/**
 * Resolve the askar sqlite path for a store, moving an existing one into the shared container
 * first.
 *
 * The identity document provider extension is a separate process that can only reach the shared
 * container, so the store has to live there for it to be able to answer requests.
 *
 * Returns `undefined` when there is no shared container — nothing to move, and Credo's default
 * path is already the right one.
 */
export async function setupAppGroupStore(
  storeId: string,
  logger?: ParadymWalletSdkLogger
): Promise<string | undefined> {
  const storePath = getWalletStorePath(storeId)
  if (!storePath) return undefined

  const fs = new agentDependencies.FileSystem()
  const appGroupDirectory = getWalletStoreDirectory(storeId)
  const defaultDirectory = getDefaultStoreDirectory(storeId)

  try {
    const appGroupStoreExists = await fs.exists(storePath)
    const defaultStoreExists = await fs.exists(`${defaultDirectory}/sqlite.db`)

    if (!appGroupStoreExists && defaultStoreExists) {
      logger?.info('Migrating askar store into the shared container', { defaultDirectory, appGroupDirectory })

      // Credo's `createDirectory` takes a file path and creates the directory holding it.
      await fs.createDirectory(storePath)
      for (const fileName of storeFileNames) {
        if (!(await fs.exists(`${defaultDirectory}/${fileName}`))) continue
        await fs.copyFile(`${defaultDirectory}/${fileName}`, `${appGroupDirectory}/${fileName}`)
      }

      // Only remove the old store once every file arrived, so a failure halfway through leaves the
      // existing installation untouched.
      await fs.delete(defaultDirectory)
    }
  } catch (error) {
    logger?.error('Could not migrate the askar store into the shared container', { error })
    return undefined
  }

  return storePath
}
