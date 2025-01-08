import { useSecureUnlock } from '@easypid/agent'
import { resetWallet } from '@easypid/utils/resetWallet'
import { useHaptics } from '@package/app/src/hooks'

import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export const useWalletReset = () => {
  const secureUnlock = useSecureUnlock()
  const router = useRouter()
  const { withHaptics } = useHaptics()

  const onResetWallet = withHaptics(
    useCallback(() => {
      Alert.alert('Reset Wallet', 'Are you sure you want to reset the wallet?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: withHaptics(() => {
            resetWallet(secureUnlock).then(() => router.replace('onboarding'))
          }),
        },
      ])
    }, [secureUnlock, router, withHaptics])
  )

  return onResetWallet
}
