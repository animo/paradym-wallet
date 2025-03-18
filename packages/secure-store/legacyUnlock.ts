import { askar } from '@openwallet-foundation/askar-react-native'
import * as SecureStore from 'expo-secure-store'

const STORE_KEY_LEGACY = 'wallet-key' as const
const STORE_KEY_RAW = 'paradym-wallet-key-raw' as const

function generateNewWalletKey(): string {
  return askar.storeGenerateRawKey({})
}

export async function createLegacySecureWalletKey(): Promise<{
  walletKey: string
  keyDerivation: 'raw'
}> {
  const secureStoreAvailable = await SecureStore.isAvailableAsync()
  if (!secureStoreAvailable) throw new Error('SecureStore is not available on this device.')

  const newWalletKey = generateNewWalletKey()
  await SecureStore.setItemAsync(STORE_KEY_RAW, newWalletKey)

  return { walletKey: newWalletKey, keyDerivation: 'raw' }
}

export async function removeLegacySecureWalletKey() {
  const secureStoreAvailable = await SecureStore.isAvailableAsync()
  if (!secureStoreAvailable) throw new Error('SecureStore is not available on this device.')

  if (await SecureStore.getItemAsync(STORE_KEY_LEGACY)) {
    await SecureStore.deleteItemAsync(STORE_KEY_LEGACY)
  }

  if (await SecureStore.getItemAsync(STORE_KEY_RAW)) {
    await SecureStore.deleteItemAsync(STORE_KEY_RAW)
  }
}

/**
 * Retrieve the wallet key from expo secure store. This is the legacy method as we now have a more secure way to unlock the wallet
 * using React Native Keychain, protected by biometrics and a deriving the wallet key from a PIN.
 *
 * This methods allows us to keep the Paradym Wallet as before, until we can update it to also use the PIN and biometric unlock capabilities.
 *
 * Once we are ready to upgrade we should ask the user to set up a PIN, and derive a new wallet key from it, and rotate the wallet key to this
 * new key. That will be able to overwrite both the raw wallet key and derived wallet key methods used in this function.
 */
export async function getLegacySecureWalletKey(): Promise<{
  walletKey: string
  keyDerivation: 'raw' | 'derive'
} | null> {
  const secureStoreAvailable = await SecureStore.isAvailableAsync()
  if (!secureStoreAvailable) throw new Error('SecureStore is not available on this device.')

  // New method: raw wallet key
  let walletKey = await SecureStore.getItemAsync(STORE_KEY_RAW)
  if (walletKey) return { walletKey, keyDerivation: 'raw' }

  // TODO: rotate the old wallet key to a new raw key
  // Old method: derived wallet key
  walletKey = await SecureStore.getItemAsync(STORE_KEY_LEGACY)
  if (walletKey) return { walletKey, keyDerivation: 'derive' }

  return null
}
