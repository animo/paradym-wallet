import type { FullAppAgent } from '@package/agent'

import { initializeFullAgent, useAgent } from '@package/agent'
import { WalletScreen } from '@package/app'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const initializeAppAgent = initializeFullAgent
export const useAppAgent = useAgent<FullAppAgent>

export default function Screen() {
  const { top } = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Home',
          header: () => {
            return <XStack h={top} bg="$grey-200" />
          },
        }}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <WalletScreen logo={require('../assets/in-app-logo.png')} />
    </>
  )
}
