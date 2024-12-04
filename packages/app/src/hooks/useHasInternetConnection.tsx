import { useNetInfo } from '@react-native-community/netinfo'

export { fetch as getNetInfo } from '@react-native-community/netinfo'

export const useHasInternetConnection = () => {
  const { isConnected, isInternetReachable } = useNetInfo()

  return (isConnected && isInternetReachable) ?? false
}

export const useIsConnectedToWifi = () => {
  const { type } = useNetInfo()
  return type === 'wifi'
}
