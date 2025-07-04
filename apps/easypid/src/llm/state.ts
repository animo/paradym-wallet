import { useMMKVBoolean } from 'react-native-mmkv'

import { mmkv } from '@easypid/storage/mmkv'

export function useIsModelActivated() {
  const [value, setValue] = useMMKVBoolean('isModelActivated', mmkv)

  return [value ?? false, setValue] as const
}

export function removeIsModelActivated() {
  mmkv.delete('isModelActivated')
}
