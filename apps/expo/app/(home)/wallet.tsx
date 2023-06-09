import { XStack, HEADER_STATUS_BAR_HEIGHT } from '@internal/ui'
import { WalletScreen } from 'app/features/wallet/WalletScreen'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => {
            return <XStack h={HEADER_STATUS_BAR_HEIGHT} bg="$grey-200" />
          },
        }}
      />
      {/* Force dark status bar in dark mode */}
      <StatusBar style="dark" />
      <WalletScreen />
    </>
  )
}
