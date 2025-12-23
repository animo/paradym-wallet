import { useLingui } from '@lingui/react/macro'
import { useToastController } from '@package/ui'
import { useNetworkState } from 'expo-network'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'

export function NoInternetToastProvider({ children }: PropsWithChildren) {
  const toast = useToastController()
  const { t } = useLingui()

  const { isConnected, isInternetReachable } = useNetworkState()
  const [hasBeenOffline, setHasBeenOffline] = useState(false)
  const [debouncedHasInternet, setDebouncedHasInternet] = useState<boolean | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)
  const isInitialMount = useRef(true)

  const hasInternet =
    // Fully reachable
    (isConnected && isInternetReachable) ||
    // Not loaded yet (null) or false
    (isConnected === null || isInternetReachable === null ? null : false)

  // Custom debounce effect that only debounces when going to false, and skips initial mount
  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // On initial mount, only set the value if it's not false
    // If it's false on initial mount, we need to wait 5 seconds before setting it
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (hasInternet !== false) {
        setDebouncedHasInternet(hasInternet)
      } else {
        // Start the debounce timer even on initial mount if connection is false
        timeoutRef.current = setTimeout(() => {
          setDebouncedHasInternet(false)
        }, 5000)
      }
      return
    }

    // If connection is back (true) or loading (null), update immediately
    if (hasInternet === true || hasInternet === null) {
      setDebouncedHasInternet(hasInternet)
    }
    // If connection is lost (false), debounce for 5 seconds
    else if (hasInternet === false) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedHasInternet(false)
      }, 5000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [hasInternet])

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
