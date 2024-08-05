import * as Keychain from 'react-native-keychain'
import { kdf } from '../kdf'
import { type KeychainOptions, getKeychainItemById, storeKeychainItem, removeKeychainItemById } from '../keychain'

const saltStoreBaseOptions: KeychainOptions = {
  /* Salt can be accessed on this device */
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}

const SALT_ID = (version: number) => `PARADYM_WALLET_SALT_${version}`

/**
 * Store the salt in the keychain.
 *
 * @throws {KeychainError} if an unexpected error occurs
 */
async function storeSalt(salt: string, version: number): Promise<void> {
  const saltId = SALT_ID(version)

  await storeKeychainItem(saltId, salt, saltStoreBaseOptions)
}

/**
 * Retrieve the salt from the keychain.
 *
 * @returns {string | null} the salt or null if it doesn't exist
 * @throws {KeychainError} if an unexpected error occurs
 */
async function getSalt(version: number): Promise<string | null> {
  const saltId = SALT_ID(version)

  // TODO: should probably throw error if not found
  const salt = await getKeychainItemById(saltId, saltStoreBaseOptions)

  return salt
}

/*
 * Generate and store a salt. Optionally returning the existing one if it exists
 */
async function createAndStoreSalt(returnExisting: boolean, version: number) {
  if (returnExisting) {
    const existingSalt = await getSalt(version)
    if (existingSalt) return existingSalt
  }

  const salt = kdf.generateSalt()
  await storeSalt(salt, version)

  return salt
}

async function removeSalt(version: number) {
  const saltId = SALT_ID(version)
  return await removeKeychainItemById(saltId, saltStoreBaseOptions)
}

export const walletKeySaltStore = {
  getSalt,
  storeSalt,
  createAndStoreSalt,
  removeSalt,
}
