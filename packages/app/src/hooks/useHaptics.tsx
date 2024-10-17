import { useCallback } from 'react'

import * as Haptics from 'expo-haptics'

type HapticType = 'light' | 'heavy' | 'success' | 'error'

export function useHaptics() {
  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const heavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }, [])

  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }, [])

  const withHaptics = useCallback(
    <T extends (...args: unknown[]) => unknown>(
      callback: T,
      hapticType: HapticType = 'light'
    ): ((...args: Parameters<T>) => ReturnType<T>) => {
      return (...args) => {
        switch (hapticType) {
          case 'heavy':
            heavy()
            break
          case 'success':
            success()
            break
          case 'error':
            error()
            break
          default:
            light()
        }
        return callback(...args) as ReturnType<T>
      }
    },
    [light, heavy, success, error]
  )

  return { light, heavy, success, error, withHaptics }
}
