import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from './hasFinishedOnboarding'

export function getShouldUseCloudHsm() {
  return mmkv.getBoolean('shouldUseCloudHsm')
}

export function useShouldUseCloudHsm() {
  return useMMKVBoolean('shouldUseCloudHsm', mmkv)
}
export function removeShouldUseCloudHsm() {
  mmkv.delete('shouldUseCloudHsm')
}
