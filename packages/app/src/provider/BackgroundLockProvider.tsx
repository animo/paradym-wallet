import { TypedArrayEncoder } from '@credo-ts/core'
import { useSecureUnlock } from '@package/secure-store/secure-wallet-key/SecureUnlockProvider'
import { usePathname } from 'expo-router'
import { useRouter } from 'expo-router'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

const BACKGROUND_TIME_THRESHOLD = 60000 // 1 minute

export function BackgroundLockProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const pathname = usePathname()
  const secureUnlock = useSecureUnlock()
  const backgroundTimeRef = useRef<Date | null>(null)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimeRef.current = new Date()
        lastPathRef.current = pathname
      } else if (nextAppState === 'active') {
        if (backgroundTimeRef.current) {
          const timeInBackground = new Date().getTime() - backgroundTimeRef.current.getTime()

          if (timeInBackground > BACKGROUND_TIME_THRESHOLD && secureUnlock.state === 'unlocked') {
            console.log('App was in background for more than 30 seconds, locking')
            const lastPath = lastPathRef.current
            secureUnlock.lock()

            if (lastPath && !['/', '/authenticate'].includes(lastPath)) {
              // Encode the path for redirection after unlock
              const encodedRedirect = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromString(lastPath))
              router.replace(`/authenticate?redirectAfterUnlock=${encodedRedirect}`)
            } else {
              router.replace('/authenticate')
            }
          }
          backgroundTimeRef.current = null
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [secureUnlock, router, pathname])

  return <>{children}</>
}
