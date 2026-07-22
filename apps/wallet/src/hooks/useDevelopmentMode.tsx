// translations not needed
import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'

export function useDevelopmentMode() {
  const [isDevEnabled, setIsDevEnabled] = useMMKVBoolean('useDevelopmentMode', mmkv)

  return [isDevEnabled, setIsDevEnabled] as const
}
