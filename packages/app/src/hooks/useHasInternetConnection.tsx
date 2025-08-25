import { useNetInfo } from '@react-native-community/netinfo'
import { useDebounce } from './useDebounce'

export { fetch as getNetInfo } from '@react-native-community/netinfo'

export const useHasInternetConnection = () => {
  const { isConnected, isInternetReachable } = useNetInfo()

  // Delay whether the device has internet by 5 seconds, since it sometimes returns
  // false after being in the background for a while.
  const hasInternetConnection = useDebounce((isConnected && isInternetReachable) ?? false, 5000)

  return hasInternetConnection
}

export const useIsConnectedToWifi = () => {
  const { type } = useNetInfo()
  return type === 'wifi'
}
