import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../../storage/mmkv'

export function getShouldUseCloudHsm() {
  return mmkv.getBoolean('shouldUseCloudHsm')
}

export function useShouldUseCloudHsm() {
  return useMMKVBoolean('shouldUseCloudHsm', mmkv)
}
export function removeShouldUseCloudHsm() {
  mmkv.delete('shouldUseCloudHsm')
}
