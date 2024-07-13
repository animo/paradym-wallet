import { WalletUnlockError } from './error/WalletUnlockError'
import { getSalt, storeSalt } from './secure-unlock/saltStore'
import { deriveWalletKey, generateSalt } from './secure-unlock/walletKeyDerivation'
import {
  canUseBiometryBackedWalletKey,
  getWalletKeyUsingBiometrics,
  storeWalletKey,
} from './secure-unlock/walletKeyStore'

// TODO: how to version?
const version = 1

export { canUseBiometryBackedWalletKey }

export async function enableBiometricsForWalletKey(walletKey: string) {
  await storeWalletKey(walletKey, version)
}

/**
 * Generate and store a salt. Optionally returning the existing one if it exists
 */
export async function createSaltForPin(returnExisting = false) {
  if (returnExisting) {
    const existingSalt = await getSalt()
    if (existingSalt) return existingSalt
  }

  const salt = generateSalt()
  await storeSalt(salt, version)

  return salt
}

export async function getWalletKeyUsingPin(pin: string) {
  const salt = await getSalt(version)
  if (!salt) {
    throw new WalletUnlockError('Error unlocking wallet. No salt configured')
  }

  const walletKey = await deriveWalletKey(pin, salt)
  return walletKey
}

export async function tryUnlockingWalletUsingBiometrics() {
  const walletKey = await getWalletKeyUsingBiometrics(version)
  return walletKey
}
