import { XStack, color } from '@internal/ui'
import { WalletScreen } from 'app/features/wallet/WalletScreen'
import { Stack } from 'expo-router'

const HEADER_STATUS_BAR_HEIGHT = 56

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => {
            return <XStack h={HEADER_STATUS_BAR_HEIGHT} bg={color['grey-200']} />
          },
        }}
      />
      <WalletScreen />
    </>
  )
}
