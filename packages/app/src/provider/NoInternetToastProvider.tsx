import type { PropsWithChildren } from 'react'

import { useToastController } from '@package/ui'
import { useNetInfo } from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

export function NoInternetToastProvider({ children }: PropsWithChildren) {
  const toast = useToastController()

  const { isConnected, isInternetReachable } = useNetInfo()
  const [hasBeenOffline, setHasBeenOffline] = useState(false)

  const hasInternet =
    // Fully reachable
    (isConnected && isInternetReachable) ||
    // Not loaded yet (null) or false
    (isConnected === null || isInternetReachable === null ? null : false)

  useEffect(() => {
    if (hasBeenOffline && hasInternet === true) {
      toast.show('Online again.')
      setHasBeenOffline(false)
    } else if (hasInternet === false && !hasBeenOffline) {
      toast.show('No internet connection. Some features may not work.')
      setHasBeenOffline(true)
    }
  }, [hasInternet, toast, hasBeenOffline])

  return <>{children}</>
}
