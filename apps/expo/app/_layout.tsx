// eslint-disable-next-line import/order
import type { AppAgent } from '@internal/agent'

import {
  AgentProvider,
  hasMediationConfigured,
  initializeAgent,
  setupMediationWithDid,
  useMessagePickup,
} from '@internal/agent'
import { config, Heading, Page, Paragraph, useToastController, XStack, YStack } from '@internal/ui'
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

import { mediatorDid } from '../constants'
import { DeeplinkHandler } from '../utils/DeeplinkHandler'
import { getSecureWalletKey } from '../utils/walletKeyStore'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
}

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
  const [isSettingUpMediation, setIsSettingUpMediation] = useState(false)
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
        setAgentInitializationFailed(true)
        toast.show('Could not initialize agent.')
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
    if (isSettingUpMediation) return

    setIsSettingUpMediation(true)

    void hasMediationConfigured(agent)
      .then(async (mediationConfigured) => {
        if (!mediationConfigured) {
          agent.config.logger.debug('Mediation not configured yet.')
          await setupMediationWithDid(agent, mediatorDid)
        }

        agent.config.logger.info("Mediation configured. You're ready to go!")
        setIsMediationConfigured(true)
      })
      .finally(() => {
        setIsSettingUpMediation(false)
      })
  }, [hasInternetConnection, agent, isMediationConfigured])

  // Hide splash screen when agent and fonts are loaded or agent could not be initialized
  useEffect(() => {
    if (fontLoaded && (agent || agentInitializationFailed)) {
      void SplashScreen.hideAsync()
    }
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
              <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
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
                  name="notifications/openIdPresentation"
                />
                <Stack.Screen
                  options={{ presentation: 'modal', ...headerModalOptions }}
                  name="notifications/didcomm"
                />
                <Stack.Screen
                  options={{
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: config.tokens.color['grey-200'].val,
                    },
                    headerShadowVisible: false,
                    headerTintColor: config.tokens.color['primary-500'].val,
                    headerTitle: 'Inbox',
                    headerTitleAlign: 'center',
                    headerTitleStyle: {
                      fontWeight: isAndroid() ? '700' : '500', // Match font weight on android to native back button style
                      fontSize: 18,
                    },
                  }}
                  name="notifications/inbox"
                />
                <Stack.Screen
                  options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTintColor: config.tokens.color['primary-500'].val,
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
