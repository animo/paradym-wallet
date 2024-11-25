import { useRouter } from 'expo-router'
import { useCallback } from 'react'

export function usePushToWallet() {
  const router = useRouter()

  const pushToWallet = useCallback(
    (variant: 'replace' | 'back' = 'back') => {
      if (variant === 'replace' || !router.canGoBack()) {
        router.replace('/')
      } else {
        router.back()
        // If we do a PIN confirmation we need to go back twice
        if (router.canGoBack()) router.back()
      }
    },
    [router]
  )

  return pushToWallet
}
