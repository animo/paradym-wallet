import type { PropsWithChildren } from 'react'

import { useLingui } from '@lingui/react/macro'
import { useToastController } from '@package/ui'
import { useNetInfo } from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'
import { useDebounce } from '../hooks'

export function NoInternetToastProvider({ children }: PropsWithChildren) {
  const toast = useToastController()
  const { t } = useLingui()

  const { isConnected, isInternetReachable } = useNetInfo()
  const [hasBeenOffline, setHasBeenOffline] = useState(false)

  const hasInternet =
    // Fully reachable
    (isConnected && isInternetReachable) ||
    // Not loaded yet (null) or false
    (isConnected === null || isInternetReachable === null ? null : false)

  const debouncedHasInternet = useDebounce(hasInternet, 5000)

  // Define messages once outside useEffect for clarity
  const onlineAgainMessage = t({
    id: 'network.onlineAgain',
    message: 'Online again.',
    comment: 'Toast message shown when internet connection is restored',
  })

  const noInternetWarningMessage = t({
    id: 'network.noInternetWarning',
    message: 'No internet connection. Some features may not work.',
    comment: 'Toast warning shown when the user loses internet connectivity',
  })

  useEffect(() => {
    if (hasBeenOffline && debouncedHasInternet === true) {
      toast.show(onlineAgainMessage, { customData: { preset: 'success' } })
      setHasBeenOffline(false)
    } else if (debouncedHasInternet === false && !hasBeenOffline) {
      toast.show(noInternetWarningMessage, { customData: { preset: 'danger' } })
      setHasBeenOffline(true)
    }
  }, [debouncedHasInternet, toast, hasBeenOffline, onlineAgainMessage, noInternetWarningMessage])

  return <>{children}</>
}
