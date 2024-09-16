import { useSecureUnlock } from '@easypid/agent'
import { resetWallet } from '@easypid/utils/resetWallet'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export const useWalletReset = () => {
  const secureUnlock = useSecureUnlock()
  const router = useRouter()

  const onResetWallet = useCallback(() => {
    Alert.alert('Reset Wallet', 'Are you sure you want to reset the wallet?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          resetWallet(secureUnlock).then(() => router.replace('onboarding'))
        },
      },
    ])
  }, [secureUnlock, router])

  return onResetWallet
}
