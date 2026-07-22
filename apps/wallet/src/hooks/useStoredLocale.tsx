import type { SupportedLocale } from '@package/translations'
import { useMMKVString } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'

export function useStoredLocale() {
  const [storedLocale, setStoredLocale] = useMMKVString('useStoredLocale', mmkv)

  return [storedLocale as SupportedLocale | undefined, setStoredLocale] as const
}
