import { useToastController } from '@internal/ui'
import { useCallback } from 'react'

import { useHasInternetConnection } from './useHasInternetConnection'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useNetworkCallback<T extends (...args: C) => D, C extends any[] = any[], D = any>(
  callback: T
): T | ((...args: C) => void) {
  const isInternetAvailable = useHasInternetConnection()
  const toast = useToastController()

  return useCallback<T>(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (...args) => {
      if (!isInternetAvailable) {
        toast.show('No internet connection. Please check your network settings.')
        return
      }

      return callback(...args)
    },
    [isInternetAvailable, callback]
  )
}
