import { TypedArrayEncoder } from '@credo-ts/core'
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { WalletUnlockError } from '../error/WalletUnlockError'
import { kdf } from '../kdf'
import { walletKeySaltStore } from './walletKeySaltStore'
import { walletKeyStore } from './walletKeyStore'

async function getWalletKeyUsingPin(pin: string, version: number) {
  const salt = await walletKeySaltStore.getSalt(version)
  if (!salt) {
    throw new WalletUnlockError('Error unlocking wallet. No salt configured')
  }

  const walletKeySeed = await kdf.derive(pin, salt)

  // The wallet key needs to be a xchaca key, so we use the derived key based on pin and salt as
  // the seed for the actual key
  const walletKey = ariesAskar.storeGenerateRawKey({ seed: TypedArrayEncoder.fromString(walletKeySeed) })

  return walletKey
}

export const secureWalletKey = {
  getWalletKeyUsingPin,
  ...walletKeyStore,
  ...walletKeySaltStore,

  // TODO: how to version
  walletKeyVersion: 1,
}
