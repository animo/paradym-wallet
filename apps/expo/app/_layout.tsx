import type { AppAgent } from '@internal/agent'

import { AgentProvider, initializeAgent } from '@internal/agent'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Provider } from 'app/provider'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'

void SplashScreen.preventAutoHideAsync()

export default function HomeLayout() {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  const [agent, setAgent] = useState<AppAgent>()
  const scheme = useColorScheme()

  // Initialize agent
  useEffect(() => {
    if (agent) return

    void initializeAgent().then((agent) => setAgent(agent))
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
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen options={{ presentation: 'modal' }} name="(home)/scan" />
            <Stack.Screen options={{ presentation: 'modal' }} name="notifications/credential" />
            <Stack.Screen options={{ presentation: 'modal' }} name="credentials/[id]" />
          </Stack>
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
