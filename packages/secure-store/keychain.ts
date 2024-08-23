import * as Keychain from 'react-native-keychain'
import { BiometricAuthenticationError } from '../agent/src'
import { KeychainError } from './error/KeychainError'

export type KeychainOptions = Omit<Keychain.Options, 'service'>

/**
 * Store the value with id in the keychain.
 *
 * @throws {KeychainError} if an unexpected error occurs
 */
export async function storeKeychainItem(id: string, value: string, options: KeychainOptions): Promise<void> {
  const result = await Keychain.setGenericPassword(id, value, {
    ...options,
    service: id,
  }).catch((error) => {
    throw (
      BiometricAuthenticationError.tryParseFromError(error) ??
      new KeychainError(`Error storing value for id '${id}' in keychain`, {
        cause: error,
      })
    )
  })

  if (!result) {
    throw new KeychainError(`Error storing value for id '${id}' in keychain`)
  }
}

/**
 * Retrieve a value by id from the keychain
 *
 * @returns {string | null} the value or null if it doesn't exist
 * @throws {KeychainError} if an unexpected error occurs
 * @throws {BiometricAuthenticationError} if biometric authentication failed
 */
export async function getKeychainItemById(id: string, options: KeychainOptions): Promise<string | null> {
  const result = await Keychain.getGenericPassword({
    ...options,
    service: id,
  }).catch((error) => {
    throw (
      BiometricAuthenticationError.tryParseFromError(error) ??
      new KeychainError(`Error retrieving value with id '${id}' from keychain`, {
        cause: error,
        reason: 'unknown',
      })
    )
  })

  if (!result) {
    return null
  }

  return result.password
}

/**
 * Remove a value by id from the keychain
 *
 * @returns {boolean} Whether the keychain item was removed
 * @throws {KeychainError} if an unexpected error occurs
 */
export async function removeKeychainItemById(id: string, options: KeychainOptions): Promise<boolean> {
  const result = await Keychain.resetGenericPassword({
    ...options,
    service: id,
  }).catch((error) => {
    throw new KeychainError(`Error removing value with id '${id}' from keychain`, {
      cause: error,
    })
  })

  return result
}
