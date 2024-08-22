import { FunkeWalletScreen } from '@ausweis/features/wallet/FunkeWalletScreen'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Screen() {
  const { top } = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Home',
          header: () => {
            return <XStack h={top} bg="$background" />
          },
        }}
      />
      <FunkeWalletScreen />
    </>
  )
}
