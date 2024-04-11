import { agentDependencies } from '@credo-ts/react-native'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import * as SecureStore from 'expo-secure-store'

const STORE_KEY_LEGACY = 'wallet-key' as const
const STORE_KEY_RAW = 'paradym-wallet-key-raw' as const

const generateNewWalletKey = (): { walletKey: string; keyDerivation: 'raw' } => {
  return { walletKey: ariesAskar.storeGenerateRawKey({}), keyDerivation: 'raw' }
}

export const getSecureWalletKey = async (): Promise<{
  walletKey: string
  keyDerivation: 'raw' | 'derive'
}> => {
  const secureStoreAvailable = await SecureStore.isAvailableAsync()
  if (!secureStoreAvailable) throw new Error('SecureStore is not available on this device.')

  // New method: raw wallet key
  let walletKey = await SecureStore.getItemAsync(STORE_KEY_RAW)
  // Fix for a period when the key was stored as 'raw' so it has to be regenerated
  if (walletKey === 'raw') {
    await fixInvalidWalletKey()
    walletKey = null
  }
  if (walletKey) return { walletKey, keyDerivation: 'raw' }

  // TODO: rotate the old wallet key to a new raw key
  // Old method: derived wallet key
  walletKey = await SecureStore.getItemAsync(STORE_KEY_LEGACY)
  if (walletKey) return { walletKey, keyDerivation: 'derive' }

  // No wallet key found, generate new method: raw wallet key
  const newWalletKey = generateNewWalletKey()
  await SecureStore.setItemAsync(STORE_KEY_RAW, newWalletKey.walletKey)

  return newWalletKey
}

/**
 * Fix for a period when the key was stored as 'raw' so the whole wallet needs to be regenerated because we don't have the original key anymore.
 */
const fixInvalidWalletKey = async () => {
  const fileSystem = new agentDependencies.FileSystem()

  if (!(await fileSystem.exists(fileSystem.dataPath))) return

  await fileSystem.delete(fileSystem.dataPath)
}
