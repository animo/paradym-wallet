import type { PropsWithChildren } from 'react'

import { useSecureUnlock } from '@package/secure-store/secure-wallet-key/SecureUnlockProvider'
import { useEffect, useRef } from 'react'
import React from 'react'
import { AppState, type AppStateStatus } from 'react-native'

const BACKGROUND_TIME_THRESHOLD = 3000 // FIXME

export function BackgroundLockProvider({ children }: PropsWithChildren) {
  const secureUnlock = useSecureUnlock()
  const backgroundTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimeRef.current = new Date()
      } else if (nextAppState === 'active') {
        if (backgroundTimeRef.current) {
          const timeInBackground = new Date().getTime() - backgroundTimeRef.current.getTime()

          if (timeInBackground > BACKGROUND_TIME_THRESHOLD && secureUnlock.state === 'unlocked') {
            console.log('App was in background for more than 30 seconds, locking')
            secureUnlock.lock()
          }
          backgroundTimeRef.current = null
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [secureUnlock])

  return <>{children}</>
}
