// translations not needed
import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'

export function useDevelopmentMode() {
  const [isDevEnabled, setIsDevEnabled] = useMMKVBoolean('useDevelopmentMode', mmkv)

  // On by default in development builds, until it is turned off
  return [isDevEnabled ?? __DEV__, setIsDevEnabled] as const
}
