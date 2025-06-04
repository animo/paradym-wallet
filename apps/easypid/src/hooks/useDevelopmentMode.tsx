import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'
import { isFunkeWallet } from './useFeatureFlag'

export function useDevelopmentMode() {
  let [isDevEnabled, setIsDevEnabled] = useMMKVBoolean('useDevelopmentMode', mmkv)

  if (isFunkeWallet() && isDevEnabled === undefined) {
    // Manually enabled here is as well, as calling setIsDevEnabled(true) does set `isDevEnabled` in this context
    // Only after a re-render
    isDevEnabled = true
    setIsDevEnabled(true)
  }

  // Type-cast done here as taking the values out of the array and adding them again messes up the types for the caller
  return [isDevEnabled, setIsDevEnabled] as const
}
