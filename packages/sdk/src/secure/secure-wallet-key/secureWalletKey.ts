import { TypedArrayEncoder } from '@credo-ts/core'
import { NativeAskar } from '@openwallet-foundation/askar-react-native'
import { useQuery } from '@tanstack/react-query'
import { createMMKV, useMMKVNumber } from 'react-native-mmkv'
import { WalletUnlockError } from '../error/WalletUnlockError'
import { kdf } from '../kdf'
import { walletKeySaltStore } from './walletKeySaltStore'
import { type WalletBiometricCapability, walletKeyStore } from './walletKeyStore'

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

export type BiometricUnlockState = WalletBiometricCapability & {
  configured: boolean
  canUnlockNow: boolean
}

export const getBiometricUnlockStateQueryKey = (version: number) => ['biometricUnlockState', version] as const

async function getBiometricUnlockState(version: number): Promise<BiometricUnlockState> {
  const [walletBiometricCapability, configured] = await Promise.all([
    walletKeyStore.getWalletBiometricCapability(),
    walletKeyStore.hasWalletKey(version),
  ])

  return {
    ...walletBiometricCapability,
    configured,
    canUnlockNow: configured && walletBiometricCapability.capable,
  }
}

export function useBiometricUnlockState() {
  const [walletKeyVersion] = useWalletKeyVersion()
  const resolvedWalletKeyVersion = walletKeyVersion ?? getWalletKeyVersion()

  return useQuery({
    queryKey: getBiometricUnlockStateQueryKey(resolvedWalletKeyVersion),
    queryFn: () => secureWalletKey.getBiometricUnlockState(resolvedWalletKeyVersion),
  })
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
  getBiometricUnlockState,

  getWalletKeyVersion,
  setWalletKeyVersion,
}
