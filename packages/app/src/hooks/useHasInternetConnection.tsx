import { NetworkStateType, useNetworkState } from 'expo-network'

export const useHasInternetConnection = () => {
  const { isConnected, isInternetReachable } = useNetworkState()

  return (isConnected && isInternetReachable) ?? false
}

export const useIsConnectedToWifi = () => {
  const { type } = useNetworkState()
  return type === NetworkStateType.WIFI
}
