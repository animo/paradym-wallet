import { TypedArrayEncoder } from '@credo-ts/core'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { useQuery } from '@tanstack/react-query'
import { createMMKV, useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv'
import { WalletUnlockError } from '../error/WalletUnlockError'
import { kdf } from '../kdf'
import { walletKeySaltStore } from './walletKeySaltStore'
import { walletKeyStore } from './walletKeyStore'

const mmkv = createMMKV()

async function getWalletKeyUsingPin(pin: string, version: number) {
  const salt = await walletKeySaltStore.getSalt(version)
  if (!salt) {
    throw new WalletUnlockError('Error unlocking wallet. No salt configured')
  }

  const walletKeySeed = kdf.derive(pin, salt)

  // The wallet key needs to be a xchaca key, so we use the derived key based on pin and salt as
  // the seed for the actual key
  const walletKey = NativeAskar.instance.storeGenerateRawKey({
    seed: TypedArrayEncoder.fromString(walletKeySeed),
  })

  return walletKey
}

export function useCanUseBiometryBackedWalletKey() {
  return useQuery({
    queryKey: ['canUseBiometryBackedWalletKey'],
    queryFn: () => secureWalletKey.canUseBiometryBackedWalletKey(),
  }).data
}

/**
 * NOTE: this just stores whether we think it's enabled. There's external reasons why
 * this can be out of sync with the actual configuration.
 *
 * We return true by default, since before we required biometrics
 */
export function useIsBiometricsEnabled() {
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useMMKVBoolean('biometricsEnabled', mmkv)
  return [isBiometricsEnabled ?? true, setIsBiometricsEnabled] as const
}

export function setIsBiometricsEnabled(isBiometricsEnabled: boolean) {
  mmkv.set('biometricsEnabled', isBiometricsEnabled)
}

export function getIsBiometricsEnabled() {
  return mmkv.getBoolean('biometricsEnabled') ?? true
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
