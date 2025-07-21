//translations: no translations needed
import { shouldUseFallbackSecureEnvironment } from '@animo-id/expo-secure-environment'
import { useCallback } from 'react'
import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../../storage/mmkv'

export function getShouldUseCloudHsm() {
  return mmkv.getBoolean('shouldUseCloudHsm')
}

export function useShouldUseCloudHsm() {
  const [shouldUseCloudHsm, _setShouldUseCloudHsm] = useMMKVBoolean('shouldUseCloudHsm', mmkv)

  const setShouldUseCloudHsm = useCallback(
    (shouldUseCloudHsm: boolean) => {
      _setShouldUseCloudHsm(shouldUseCloudHsm)
      shouldUseFallbackSecureEnvironment(shouldUseCloudHsm)
    },
    [_setShouldUseCloudHsm]
  )

  return [shouldUseCloudHsm, setShouldUseCloudHsm] as const
}
export function removeShouldUseCloudHsm() {
  mmkv.delete('shouldUseCloudHsm')
}
