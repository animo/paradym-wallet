import { useEffect, useState } from 'react'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Provider } from 'app/provider'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { AgentProvider, initializeAgent } from '@internal/agent'
import { AppAgent } from '@internal/agent'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

export default function HomeLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  const [agent, setAgent] = useState<AppAgent>()
  const scheme = useColorScheme()

  // Initialize agent
  useEffect(() => {
    if (agent) return

    initializeAgent().then((agent) => setAgent(agent))
  }, [])

  // Hide splash screen when agent and fonts are loaded
  useEffect(() => {
    if (loaded && agent) SplashScreen.hideAsync()
  }, [loaded, agent])

  // The splash screen will be rendered on top of this
  if (!loaded || !agent) {
    return null
  }

  return (
    <Provider>
      <AgentProvider agent={agent}>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack />
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
