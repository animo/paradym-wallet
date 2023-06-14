import type { AppAgent } from '@internal/agent'

import { AgentProvider, initializeAgent } from '@internal/agent'
import { HEADER_STATUS_BAR_HEIGHT, XStack } from '@internal/ui'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Provider } from 'app/provider'
import { isAndroid } from 'app/utils/platform'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'

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

  // If the screen is a Modal, we push down the content on Android
  // as Android phones don't support Modals.
  const headerModalOptions = isAndroid() && {
    headerShown: true,
    header: () => {
      return <XStack h={HEADER_STATUS_BAR_HEIGHT} />
    },
  }

  return (
    <Provider>
      <AgentProvider agent={agent}>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              options={{
                presentation: 'modal',
              }}
              name="(home)/scan"
            />
            <Stack.Screen
              options={{ presentation: 'modal', ...headerModalOptions }}
              name="notifications/credential"
            />
            <Stack.Screen
              options={{ presentation: 'modal', ...headerModalOptions }}
              name="notifications/presentation"
            />
            <Stack.Screen
              options={{
                presentation: 'modal',
                ...headerModalOptions,
              }}
              name="credentials/[id]"
            />
          </Stack>
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
