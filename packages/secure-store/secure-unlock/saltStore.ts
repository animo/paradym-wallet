import * as Keychain from 'react-native-keychain'
import { type KeychainOptions, getKeychainItemById, storeKeychainItem } from '../keychain'

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
export async function storeSalt(salt: string, version = 1): Promise<void> {
  const saltId = SALT_ID(version)

  await storeKeychainItem(saltId, salt, saltStoreBaseOptions)
}

/**
 * Retrieve the salt from the keychain.
 *
 * @returns {string | null} the salt or null if it doesn't exist
 * @throws {KeychainError} if an unexpected error occurs
 */
export async function getSalt(version = 1): Promise<string | null> {
  const saltId = SALT_ID(version)

  // TODO: should probably throw error if not found
  const salt = await getKeychainItemById(saltId, saltStoreBaseOptions)

  return salt
}
