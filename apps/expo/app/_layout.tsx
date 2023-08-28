import type { AppAgent } from '@internal/agent'

import {
  useMessagePickup,
  hasMediationConfigured,
  setupMediationWithInvitationUrl,
  AgentProvider,
  initializeAgent,
} from '@internal/agent'
import { Heading, Page, Paragraph, XStack, YStack, useToastController } from '@internal/ui'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useHasInternetConnection } from 'app/hooks/useHasInternetConnection'
import { useTransparentNavigationBar } from 'app/hooks/useTransparentNavigationBar'
import { Provider } from 'app/provider'
import { NoInternetToastProvider } from 'app/provider/NoInternetToastProvider'
import { isAndroid } from 'app/utils/platform'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { mediatorInvitationUrl } from '../constants'
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
  const [isMediationConfigured, setIsMediationConfigured] = useState(false)
  const hasInternetConnection = useHasInternetConnection()

  const [agentInitializationFailed, setAgentInitializationFailed] = useState(false)
  const toast = useToastController()
  const { top } = useSafeAreaInsets()
  useTransparentNavigationBar()

  // Enable message pickup when mediation is configured and internet connection is available
  useMessagePickup({
    isEnabled: hasInternetConnection && isMediationConfigured,
    agent,
  })

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

  // Setup mediation
  useEffect(() => {
    if (!agent) return
    if (!hasInternetConnection || isMediationConfigured) return

    void hasMediationConfigured(agent).then(async (mediationConfigured) => {
      // TODO: replace with setupMediationWithDid, once mediator has been setup
      if (!mediationConfigured) {
        agent.config.logger.debug('Mediation not configured yet.')
        await setupMediationWithInvitationUrl(agent, mediatorInvitationUrl)
      }

      agent.config.logger.info("Mediation configured. You're ready to go!")
      setIsMediationConfigured(true)
    })
  }, [hasInternetConnection, agent, isMediationConfigured])

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
          <NoInternetToastProvider>
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
                  name="notifications/openIdCredential"
                />
                <Stack.Screen
                  options={{ presentation: 'modal', ...headerModalOptions }}
                  name="notifications/didCommCredential"
                />
                <Stack.Screen
                  options={{ presentation: 'modal', ...headerModalOptions }}
                  name="notifications/openIdPresentation"
                />
                <Stack.Screen
                  options={{ presentation: 'modal', ...headerModalOptions }}
                  name="notifications/didCommPresentation"
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
          </NoInternetToastProvider>
        </ThemeProvider>
      </AgentProvider>
    </Provider>
  )
}
