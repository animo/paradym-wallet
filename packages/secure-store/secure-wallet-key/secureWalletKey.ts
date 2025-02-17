import { TypedArrayEncoder } from '@credo-ts/core'
import { askar } from '@openwallet-foundation/askar-react-native'
import { MMKV, useMMKVNumber } from 'react-native-mmkv'
import { WalletUnlockError } from '../error/WalletUnlockError'
import { kdf } from '../kdf'
import { walletKeySaltStore } from './walletKeySaltStore'
import { walletKeyStore } from './walletKeyStore'

const mmkv = new MMKV()

async function getWalletKeyUsingPin(pin: string, version: number) {
  const salt = await walletKeySaltStore.getSalt(version)
  if (!salt) {
    throw new WalletUnlockError('Error unlocking wallet. No salt configured')
  }

  const walletKeySeed = await kdf.derive(pin, salt)

  // The wallet key needs to be a xchaca key, so we use the derived key based on pin and salt as
  // the seed for the actual key
  const walletKey = askar.storeGenerateRawKey({ seed: TypedArrayEncoder.fromString(walletKeySeed) })

  return walletKey
}

export function useWalletKeyVersion() {
  return useMMKVNumber('walletKeyVersion', mmkv)
}

export function getWalletKeyVersion() {
  return mmkv.getNumber('walletKeyVersion') ?? 1
}

export function setWalletKeyVersion(version: number) {
  mmkv.set('walletKeyVersion', version)
}

export const secureWalletKey = {
  getWalletKeyUsingPin,
  ...walletKeyStore,
  ...walletKeySaltStore,

  getWalletKeyVersion,
  setWalletKeyVersion,
}
