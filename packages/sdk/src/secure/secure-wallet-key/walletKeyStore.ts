import { Platform } from 'react-native'
import * as Keychain from 'react-native-keychain'
import {
  getKeychainItemById,
  hasKeychainItemById,
  type KeychainAuthenticationTypeOptions,
  type KeychainSetOptions,
  removeKeychainItemById,
  storeKeychainItem,
} from '../keychain'

const walletKeyStoreBaseOptions: KeychainSetOptions & KeychainAuthenticationTypeOptions = {
  /* Only allow the current set of enrolled biometrics to access the wallet key */
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,

  // TODO: might want to use WHEN_UNLOCKED_THIS_DEVICE_ONLY, to allow devices without a passcode (as we have our own passcode and extra biometrics check)
  // Not sure how it works if you have no passcode, but you do have biometrics (i think that is not possible?)
  /* Only allow access to the wallet key on the device is was created on, is unlocked, and has a passcode set */
  accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,

  // TODO: internationalization
  authenticationPrompt: {
    title: 'Unlock wallet',
    description: 'Access to your wallet is locked behind a biometric verification.',
  },

  /* Android Only. Ensure wallet key is protected by hardware. Wil results in error if hardware is not available. Hardware is either StrongBox or TEE */
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,

  /* Android Only. Ensure wallet key is protected using RSA storage type, this is the only storage type supporting biometrics. */
  storage: Keychain.STORAGE_TYPE.RSA,

  /* Ensure wallet key is protected by biometrics. It is not possible to fallback to the device passcode if the biometric authentication failed. */
  authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
}

const WALLET_KEY_ID = (version: number) => `PARADYM_WALLET_KEY_${version}`

export type WalletBiometricCapability = {
  capable: boolean
  biometryType: Keychain.BIOMETRY_TYPE | null
}

async function getWalletBiometricCapability(): Promise<WalletBiometricCapability> {
  const biometryType = await Keychain.getSupportedBiometryType()

  if (Platform.OS === 'android') {
    /**
     * `setUserAuthenticationParameters` is only available on Android API 30+, and is needed to ensure
     * the key can only be accessed using biometry. `getSupportedBiometryType()` only returns a value on
     * Android when a strong biometric is available, so this keeps wallet unlock on Class 3 only.
     */
    return {
      capable: Platform.Version >= 30 && biometryType !== null,
      biometryType,
    }
  }

  if (Platform.OS === 'ios') {
    if (!biometryType) {
      return {
        capable: false,
        biometryType,
      }
    }

    /**
     * Checks whether the key can be authenticated using only biometrics (no passcode fallback)
     */
    const canUseAuthentication = await Keychain.canImplyAuthentication(walletKeyStoreBaseOptions)

    return {
      capable: canUseAuthentication,
      biometryType,
    }
  }

  return {
    capable: false,
    biometryType,
  }
}

/**
 * Store the wallet key in hardware backed, biometric protected storage.
 *
 * Will use Secure Enclave on iOS and StrongBox/TEE on Android. If biometrics is not enabled/available,
 * or when hardware backed storage.
 *
 * @throws {KeychainError} if an unexpected error occurs
 */
async function storeWalletKey(walletKey: string, version: number): Promise<void> {
  const walletKeyId = WALLET_KEY_ID(version)
  await storeKeychainItem(walletKeyId, walletKey, walletKeyStoreBaseOptions)
}

/**
 * Retrieve the wallet key from hardware backed, biometric protected storage.
 *
 * @returns {string | null} the wallet key or null if it doesn't exist
 * @throws {KeychainError} if an unexpected error occurs
 */
async function getWalletKeyUsingBiometrics(version: number): Promise<string | null> {
  const walletKeyId = WALLET_KEY_ID(version)
  return await getKeychainItemById(walletKeyId, walletKeyStoreBaseOptions)
}

/**
 * Check whether a biometric protected wallet key exists in the keychain.
 *
 * @returns {boolean} whether the wallet key exists
 * @throws {KeychainError} if an unexpected error occurs
 */
async function hasWalletKey(version: number): Promise<boolean> {
  const walletKeyId = WALLET_KEY_ID(version)
  return await hasKeychainItemById(walletKeyId)
}

/**
 * Delete the wallet key from hardware backed, biometric protected storage.
 *
 * @returns {boolean} whether the wallet key was removed (false if the wallet key wasn't stored)
 * @throws {KeychainError} if an unexpected error occurs
 */
async function removeWalletKey(version: number): Promise<boolean> {
  const walletKeyId = WALLET_KEY_ID(version)
  return await removeKeychainItemById(walletKeyId, walletKeyStoreBaseOptions)
}

export const walletKeyStore = {
  removeWalletKey,
  getWalletKeyUsingBiometrics,
  getWalletBiometricCapability,
  hasWalletKey,
  storeWalletKey,
}
