import { XStack } from '@internal/ui'
import { WalletScreen } from 'app/features/wallet/WalletScreen'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Screen() {
  const { top } = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => {
            return <XStack h={top} bg="$grey-50" />
          },
        }}
      />
      <WalletScreen />
    </>
  )
}
