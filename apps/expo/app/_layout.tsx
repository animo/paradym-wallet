import type { AppAgent } from '@internal/agent'

import { AgentProvider, initializeAgent } from '@internal/agent'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Provider } from 'app/provider'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'

import { getSecureWalletKey } from '../utils/walletKeyStore'

void SplashScreen.preventAutoHideAsync()

export default function HomeLayout() {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    InterRegular: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    InterSemiBold: require('@tamagui/font-inter/otf/Inter-SemiBold.otf'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  const [agent, setAgent] = useState<AppAgent>()

  // Initialize agent
  useEffect(() => {
    if (agent) return

    const startAgent = async () => {
      const walletKey = await getSecureWalletKey()

      const agent = await initializeAgent(walletKey)

      setAgent(agent)
    }

    void startAgent()
  }, [])

  // Hide splash screen when agent and fonts are loaded
  useEffect(() => {
    if (loaded && agent) void SplashScreen.hideAsync()
  }, [loaded, agent])

  // The splash screen will be rendered on top of this
  if (!loaded || !agent) {
    return null
  }

  return (
    <Provider>
      <AgentProvider agent={agent}>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen options={{ presentation: 'modal' }} name="(home)/scan" />
            <Stack.Screen options={{ presentation: 'modal' }} name="notifications/credential" />
            <Stack.Screen options={{ presentation: 'modal' }} name="notifications/presentation" />
            <Stack.Screen options={{ presentation: 'modal' }} name="credentials/[id]" />
          </Stack>
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
