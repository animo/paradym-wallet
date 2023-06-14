import { useToastController } from '@internal/ui'
import { useCallback } from 'react'

import { useHasInternetConnection } from './useHasInternetConnection'

export function useNetworkCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): (...args: Parameters<T>) => void {
  const isInternetAvailable = useHasInternetConnection()
  const toast = useToastController()

  return useCallback(
    (...args) => {
      if (!isInternetAvailable) {
        toast.show('No internet connection. Please check your network settings.')
        return
      }

      callback(...args)
    },
    [isInternetAvailable, callback]
  )
}
