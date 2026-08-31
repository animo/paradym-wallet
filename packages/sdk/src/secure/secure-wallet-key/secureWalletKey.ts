import { useQuery } from '@tanstack/react-query'
import { useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv'
import {
  getIsBiometricsEnabled,
  getSharedMmkv,
  getWalletKeyVersion,
  setIsBiometricsEnabled,
  setWalletKeyVersion,
} from '../../storage/sharedMmkv'
import { getWalletKeyUsingPin } from '../walletKey'
import { walletKeySaltStore } from './walletKeySaltStore'
import { walletKeyStore } from './walletKeyStore'

const mmkv = getSharedMmkv()

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

export function useWalletKeyVersion() {
  return useMMKVNumber('walletKeyVersion', mmkv)
}

export { getIsBiometricsEnabled, getWalletKeyVersion, setIsBiometricsEnabled, setWalletKeyVersion }

export const secureWalletKey = {
  getWalletKeyUsingPin,
  ...walletKeyStore,
  ...walletKeySaltStore,

  getWalletKeyVersion,
  setWalletKeyVersion,
}
