import { useHaptics } from '@package/app/hooks'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

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
