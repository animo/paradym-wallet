import { useHaptics } from '@package/app/src/hooks'

import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export const useWalletReset = () => {
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
            router.replace('/onboarding?reset=true')
          }),
        },
      ])
    }, [router, withHaptics])
  )

  return onResetWallet
}
