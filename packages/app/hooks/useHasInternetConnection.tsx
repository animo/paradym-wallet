import { getNetworkStateAsync } from 'expo-network'
import { useState, useEffect } from 'react'

export const useHasInternetConnection = () => {
  const [hasInternetConnection, setHasInternetConnection] = useState(false)

  useEffect(() => {
    const fetchNetworkState = async () => {
      const { isConnected, isInternetReachable } = await getNetworkStateAsync()
      setHasInternetConnection((isConnected && isInternetReachable) ?? false)
    }

    void fetchNetworkState()
  }, [])

  return hasInternetConnection
}
