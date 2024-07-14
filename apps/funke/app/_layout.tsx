import type { OpenId4VcHolderAppAgent } from '@package/agent'

import { AgentProvider } from '@package/agent'
import {
  DeeplinkHandler,
  NoInternetToastProvider,
  Provider,
  isAndroid,
  useTransparentNavigationBar,
} from '@package/app'
import { Heading, Page, Paragraph, XStack, YStack, config, useToastController } from '@package/ui'
import { getSecureWalletKey } from '@package/utils'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { initializeAppAgent } from '.'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
}

export default function HomeLayout() {
  const [agent, setAgent] = useState<OpenId4VcHolderAppAgent>()

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

      try {
        const agent = await initializeAppAgent({
          ...walletKey,
          walletId: 'funke-wallet-secure',
          walletLabel: 'funke-wallet',
        })

        setAgent(agent)
      } catch {
        setAgentInitializationFailed(true)
        toast.show('Could not initialize agent.')
      }
      if (!agent) return
    }

    void startAgent()
  }, [toast, agent])

  // Hide splash screen when agent and fonts are loaded or agent could not be initialized
  useEffect(() => {
    if (agent || agentInitializationFailed) {
      void SplashScreen.hideAsync()
    }
  }, [agent, agentInitializationFailed])

  // Show error screen if agent could not be initialized
  if (agentInitializationFailed) {
    return (
      <Provider>
        <Page jc="center" ai="center" g="md">
          <YStack>
            <Heading variant="h1">Error</Heading>
            <Paragraph>Could not establish a secure environment. The current device could be not supported.</Paragraph>
          </YStack>
        </Page>
      </Provider>
    )
  }

  // The splash screen will be rendered on top of this
  if (!agent) {
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
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    </Provider>
  )
}
