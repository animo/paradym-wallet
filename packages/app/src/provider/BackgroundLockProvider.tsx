import { useParadym } from '@paradym/wallet-sdk/hooks'
import { useRouter } from 'expo-router'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

const BACKGROUND_TIME_THRESHOLD = 60000 // 60 seconds

export function BackgroundLockProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const paradym = useParadym()
  const backgroundTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimeRef.current = new Date()
      } else if (nextAppState === 'active') {
        if (backgroundTimeRef.current) {
          const timeInBackground = Date.now() - backgroundTimeRef.current.getTime()

          if (timeInBackground > BACKGROUND_TIME_THRESHOLD && paradym.state === 'unlocked') {
            console.log('App was in background for more than 30 seconds, locking')
            paradym.lock()
            router.replace('/authenticate')
          }
          backgroundTimeRef.current = null
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [paradym, router])

  return <>{children}</>
}
