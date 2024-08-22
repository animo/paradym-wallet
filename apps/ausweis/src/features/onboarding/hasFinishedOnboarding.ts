import { MMKV, useMMKVBoolean } from 'react-native-mmkv'

const mmkv = new MMKV()

export function useHasFinishedOnboarding() {
  return useMMKVBoolean('hasFinishedOnboarding', mmkv)
}
export function removeHasFinishedOnboarding() {
  mmkv.delete('hasFinishedOnboarding')
}
