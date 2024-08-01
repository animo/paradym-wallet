import argon2 from 'react-native-argon2'
import { getSalt, storeSalt } from './saltStore'
import { WalletUnlockError } from '../error/WalletUnlockError'

import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { TypedArrayEncoder } from '@credo-ts/core'

/**
 * Generate and store a salt. Optionally returning the existing one if it exists
 */
export async function createSaltForPin(returnExisting: boolean, version: number) {
  if (returnExisting) {
    const existingSalt = await getSalt(version)
    if (existingSalt) return existingSalt
  }

  const salt = generateSalt()
  await storeSalt(salt, version)

  return salt
}

/**
 * Derive key from pin and salt.
 *
 * Configuration based on recommended parameters defined in RFC 9106
 * @see https://www.rfc-editor.org/rfc/rfc9106.html#name-parameter-choice
 */
export async function deriveWalletKeySeed(pin: string, salt: string) {
  const { rawHash } = await argon2(pin, salt, {
    hashLength: 32,
    mode: 'argon2id',
    parallelism: 4,
    iterations: 1,
    memory: 21,
  })

  return rawHash
}

/**
 * Generate 32 byte key crypto getRandomValues.
 *
 * @see https://github.com/LinusU/react-native-get-random-values
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
export function generateSalt(): string {
  return crypto.getRandomValues(new Uint8Array(32)).join('')
}

export async function getWalletKeyUsingPin(pin: string, version: number) {
  const salt = await getSalt(version)
  if (!salt) {
    throw new WalletUnlockError('Error unlocking wallet. No salt configured')
  }

  const walletKeySeed = await deriveWalletKeySeed(pin, salt)

  // The wallet key needs to be a xchaca key, so we use the derived key based on pin and salt as
  // the seed for the actual key
  const walletKey = ariesAskar.storeGenerateRawKey({ seed: TypedArrayEncoder.fromString(walletKeySeed) })

  return walletKey
}
