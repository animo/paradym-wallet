import type { EitherAgent } from '@package/agent'

import { initializeParadymAgent, useAgent } from '@package/agent'
import { WalletScreen } from '@package/app'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const initializeAppAgent = initializeParadymAgent
export const useAppAgent = useAgent<EitherAgent>

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
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <WalletScreen logo={require('../assets/in-app-logo.png')} />
    </>
  )
}
