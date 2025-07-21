import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../../storage/mmkv'

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
