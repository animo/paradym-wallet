import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import { commonMessages } from '@package/translations'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export const useWalletReset = () => {
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  const onResetWallet = withHaptics(
    useCallback(() => {
      Alert.alert(t(commonMessages.reset), t(commonMessages.confirmResetWallet), [
        {
          text: t(commonMessages.cancel),
          style: 'cancel',
        },
        {
          text: t(commonMessages.yes),
          onPress: withHaptics(() => {
            router.replace('/onboarding?reset=true')
          }),
        },
      ])
    }, [router, withHaptics, t])
  )

  return onResetWallet
}
