import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'

export function useDevelopmentMode() {
  return useMMKVBoolean('useDevelopmentMode', mmkv)
}
