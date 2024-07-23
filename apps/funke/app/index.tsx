import type { OpenId4VcHolderAppAgent } from '@package/agent'

import { initializeOpenId4VcHolderAgent, useAgent } from '@package/agent'
import { WalletScreen } from '@package/app'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const initializeAppAgent = initializeOpenId4VcHolderAgent
export const useAppAgent = useAgent<OpenId4VcHolderAppAgent>

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
      <WalletScreen logo={require('../assets/in-app-logo.png')} />
    </>
  )
}
