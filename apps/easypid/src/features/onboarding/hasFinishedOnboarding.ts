import { MMKV, useMMKVBoolean } from 'react-native-mmkv'

export const mmkv = new MMKV()

export function useHasFinishedOnboarding() {
  return useMMKVBoolean('hasFinishedOnboarding', mmkv)
}
export function removeHasFinishedOnboarding() {
  mmkv.delete('hasFinishedOnboarding')
}

export function useHasSeenIntroTooltip() {
  return useMMKVBoolean('hasSeenIntroTooltip', mmkv)
}

export function removeHasSeenIntroTooltip() {
  mmkv.delete('hasSeenIntroTooltip')
}
