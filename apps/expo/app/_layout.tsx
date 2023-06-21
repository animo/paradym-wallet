import type { AppAgent } from '@internal/agent'

import { AgentProvider, initializeAgent } from '@internal/agent'
import { Heading, Page, Paragraph, XStack, YStack, useToastController } from '@internal/ui'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useTransparentNavigationBar } from 'app/hooks/useTransparentNavigationBar'
import { Provider } from 'app/provider'
import { isAndroid } from 'app/utils/platform'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DeeplinkHandler } from '../utils/DeeplinkHandler'
import { getSecureWalletKey } from '../utils/walletKeyStore'

void SplashScreen.preventAutoHideAsync()

export default function HomeLayout() {
  const [fontLoaded] = useFonts({
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
  const [agentInitializationFailed, setAgentInitializationFailed] = useState(false)
  const toast = useToastController()
  const { top } = useSafeAreaInsets()
  useTransparentNavigationBar()

  // Initialize agent
  useEffect(() => {
    if (agent) return

    const startAgent = async () => {
      const walletKey = await getSecureWalletKey().catch(() => {
        toast.show('Could not load wallet key from secure storage.')
        setAgentInitializationFailed(true)
      })
      if (!walletKey) return

      const agent = await initializeAgent(walletKey).catch(() => {
        toast.show('Could not initialize agent.')
        setAgentInitializationFailed(true)
      })
      if (!agent) return

      setAgent(agent)
    }

    void startAgent()
  }, [])

  // Hide splash screen when agent and fonts are loaded or agent could not be initialized
  useEffect(() => {
    if (fontLoaded && (agent || agentInitializationFailed)) void SplashScreen.hideAsync()
  }, [fontLoaded, agent, agentInitializationFailed])

  // Show error screen if agent could not be initialized
  if (fontLoaded && agentInitializationFailed) {
    return (
      <Provider>
        <Page jc="center" ai="center" g="md">
          <YStack>
            <Heading variant="h1">Error</Heading>
            <Paragraph>
              Could not establish a secure environment. The current device could be not supported.
            </Paragraph>
          </YStack>
        </Page>
      </Provider>
    )
  }

  // The splash screen will be rendered on top of this
  if (!fontLoaded || !agent) {
    return null
  }

  // On Android, we push down the screen content when the presentation is a Modal
  // This is because Android phones render Modals as full screen pages.
  const headerModalOptions = isAndroid() && {
    headerShown: true,
    header: () => {
      // Header is translucent by default. See configuration in app.json
      return <XStack bg="$grey-200" h={top} />
    },
  }

  return (
    <Provider>
      <AgentProvider agent={agent}>
        <ThemeProvider value={DefaultTheme}>
          <DeeplinkHandler>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                options={{
                  presentation: 'modal',
                  // Extra modal options not needed for QR Scanner
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
                  headerShown: true,
                  headerTransparent: true,
                  headerTintColor: '#5A33F6',
                  headerTitle: '',
                }}
                name="credentials/[id]"
              />
            </Stack>
          </DeeplinkHandler>
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
