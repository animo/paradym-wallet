import { uuid } from '@aries-framework/core/build/utils/uuid'
import * as SecureStore from 'expo-secure-store'

const STORE_KEY = 'wallet-key' as const

const generateNewWalletKey = (): string => {
  return uuid()
}

export const getSecureWalletKey = async (): Promise<string> => {
  const secureStoreAvailable = await SecureStore.isAvailableAsync()
  if (!secureStoreAvailable) throw new Error('SecureStore is not available on this device.')

  const walletKey = await SecureStore.getItemAsync(STORE_KEY)
  if (walletKey) return walletKey

  const newWalletKey = generateNewWalletKey()
  await SecureStore.setItemAsync(STORE_KEY, newWalletKey)

  return newWalletKey
}
