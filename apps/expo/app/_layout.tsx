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
  const [agentInitialisationFailed, setAgentInitialisationFailed] = useState(false)
  const toast = useToastController()

  // Initialize agent
  useEffect(() => {
    if (agent) return

    const startAgent = async () => {
      const walletKey = await getSecureWalletKey().catch(() => {
        toast.show('Could not load wallet key from secure storage.')
        setAgentInitialisationFailed(true)
      })
      if (!walletKey) return

      const agent = await initializeAgent(walletKey).catch(() => {
        toast.show('Could not initialize agent.')
        setAgentInitialisationFailed(true)
      })
      if (!agent) return

      setAgent(agent)
    }

    void startAgent()
  }, [])

  // Hide splash screen when agent and fonts are loaded or agent could not be initialized
  useEffect(() => {
    if (fontLoaded && (agent || agentInitialisationFailed)) void SplashScreen.hideAsync()
  }, [fontLoaded, agent, agentInitialisationFailed])

  // Show error screen if agent could not be initialized
  if (fontLoaded && agentInitialisationFailed) {
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
