import { useMMKVBoolean } from 'react-native-mmkv'

import { mmkv } from '@easypid/storage/mmkv'

export function useIsModelReady() {
  return useMMKVBoolean('isModelReady', mmkv)
}

export function removeIsModelReady() {
  mmkv.delete('isModelReady')
}

export function useIsModelActivated() {
  return useMMKVBoolean('isModelActivated', mmkv)
}

export function removeIsModelActivated() {
  mmkv.delete('isModelActivated')
}

export function useIsModelDownloading() {
  return useMMKVBoolean('isModelDownloading', mmkv)
}

export function removeIsModelDownloading() {
  mmkv.delete('isModelDownloading')
}
