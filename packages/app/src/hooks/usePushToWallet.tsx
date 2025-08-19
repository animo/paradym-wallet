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
        // TODO: this is "broken" when you scan an offer and you cannot fulfill it. It just throws "action 'GO_BACK' was not handled by any navigator". It is a dev error, but it might be good to resolve this. I think it might happen because the `canGoback` is not yet updated when `router.back()` is called.
        //
        // If we do a PIN confirmation we need to go back twice
        if (router.canGoBack()) router.back()
      }
    },
    [router]
  )

  return pushToWallet
}
