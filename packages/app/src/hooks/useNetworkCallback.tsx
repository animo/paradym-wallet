import { useLingui } from '@lingui/react/macro'
import { useToastController } from '@package/ui'
import { useCallback } from 'react'
import { useHasInternetConnection } from './useHasInternetConnection'

export function useNetworkCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): (...args: Parameters<T>) => void {
  const isInternetAvailable = useHasInternetConnection()
  const toast = useToastController()
  const { t } = useLingui()
  const noInternetMessage = t({
    id: 'network.noInternet',
    message: 'No internet connection. Please check your network settings.',
    comment: 'Toast message shown when there is no internet connection',
  })

  return useCallback(
    (...args) => {
      if (!isInternetAvailable) {
        toast.show(noInternetMessage)
        return
      }

      callback(...args)
    },
    [isInternetAvailable, callback, toast, noInternetMessage]
  )
}
