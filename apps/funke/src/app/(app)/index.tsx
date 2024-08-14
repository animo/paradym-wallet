import { WalletScreen } from '@package/app'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import inAppLogo from '../../../assets/in-app-logo.png'

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
      <WalletScreen logo={inAppLogo} showInbox={false} />
    </>
  )
}
