import { useParadym } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

const BACKGROUND_TIME_THRESHOLD = 60000 // 60 seconds

/** How far below the lock threshold a background stay has to be for the lock to be safely out of reach. */
const BACKGROUND_LOCK_MARGIN = 15000

// Module level rather than in the provider, so a deep link handler outside React can read it.
let backgroundedAt: Date | null = null

/**
 * Whether the app has been in the background long enough that the background lock may fire when it
 * becomes active. A deep link that arrives well before that can open its screen in the unlocked
 * wallet, without racing the lock's own redirect to the unlock screen.
 */
export function mayBackgroundLockTrigger() {
  return (
    backgroundedAt !== null &&
    Date.now() - backgroundedAt.getTime() > BACKGROUND_TIME_THRESHOLD - BACKGROUND_LOCK_MARGIN
  )
}

export function BackgroundLockProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const paradym = useParadym()

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // An `inactive` that follows `background` keeps the earlier time
        backgroundedAt ??= new Date()
      } else if (nextAppState === 'active') {
        if (backgroundedAt) {
          const timeInBackground = Date.now() - backgroundedAt.getTime()

          if (timeInBackground > BACKGROUND_TIME_THRESHOLD && paradym.state === 'unlocked') {
            console.log('App was in background for more than 30 seconds, locking')
            paradym.lock()
            router.replace('/authenticate')
          }
          backgroundedAt = null
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
