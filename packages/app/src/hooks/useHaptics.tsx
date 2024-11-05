import { useCallback } from 'react'

import * as Haptics from 'expo-haptics'

type HapticType = 'light' | 'heavy' | 'success' | 'error'

export function useHaptics() {
  const lightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const heavyHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }, [])

  const successHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }, [])

  const errorHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }, [])

  const withHaptics = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: should work no matter what the callback returns
    <T extends (...args: any[]) => any>(callback: T, hapticType: HapticType = 'light'): T => {
      return ((...args) => {
        switch (hapticType) {
          case 'heavy':
            heavyHaptic()
            break
          case 'success':
            successHaptic()
            break
          case 'error':
            errorHaptic()
            break
          default:
            lightHaptic()
        }
        return callback(...args)
      }) as T
    },
    [lightHaptic, heavyHaptic, successHaptic, errorHaptic]
  )

  return { lightHaptic, heavyHaptic, successHaptic, errorHaptic, withHaptics }
}
