import { useAppAgent } from '@ausweis/agent'
import { FunkeWalletScreen } from '@ausweis/features/wallet/FunkeWalletScreen'
import { SeedCredentialProvider } from '@ausweis/storage'
import type { FullAppAgent } from '@package/agent'
import { XStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Screen() {
  const { top } = useSafeAreaInsets()
  const { agent } = useAppAgent()

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
      <SeedCredentialProvider agent={agent as unknown as FullAppAgent}>
        <FunkeWalletScreen />
      </SeedCredentialProvider>
    </>
  )
}
