import { AgentProvider, initializeParadymAgent, useMediatorSetup } from '@package/agent'
import {
  DeeplinkHandler,
  NoInternetToastProvider,
  Provider,
  isAndroid,
  useHasInternetConnection,
  useTransparentNavigationBar,
} from '@package/app'
import { getLegacySecureWalletKey, createLegacySecureWalletKey } from '@package/secure-store/legacyUnlock'
import { Heading, Page, Paragraph, XStack, YStack, config, useToastController } from '@package/ui'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { type ParadymAppAgent, isParadymAgent } from '@package/agent/src/agent'
import tamaguiConfig from '../tamagui.config'
import { mediatorDid } from './constants'

void SplashScreen.preventAutoHideAsync()

export const unstable_settings = {
  // Ensure any route can link back to `/`
  initialRouteName: 'index',
}

export default function HomeLayout() {
  const [agent, setAgent] = useState<ParadymAppAgent>()
  const hasInternetConnection = useHasInternetConnection()

  const [agentInitializationFailed, setAgentInitializationFailed] = useState(false)
  const toast = useToastController()
  const { top } = useSafeAreaInsets()
  useTransparentNavigationBar()

  // Only setup mediation if the agent is a paradym agent
  useMediatorSetup({
    agent: agent && isParadymAgent(agent) ? agent : undefined,
    hasInternetConnection,
    mediatorDid,
  })

  // Initialize agent
  useEffect(() => {
    if (agent) return

    const startAgent = async () => {
      const walletKey = await getLegacySecureWalletKey()
        .then(async (walletKey) => walletKey ?? (await createLegacySecureWalletKey()))
        .catch(() => {
          toast.show('Could not load wallet key from secure storage.')
          setAgentInitializationFailed(true)
        })
      if (!walletKey) return

      // This will be removed in the future
      const agent = await initializeParadymAgent({
        ...walletKey,
        walletLabel: 'paradym-wallet',
        walletId: 'paradym-wallet-secure',
      }).catch(() => {
        setAgentInitializationFailed(true)
        toast.show('Could not initialize agent.')
      })
      if (!agent) return

      setAgent(agent)
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
      <Provider config={tamaguiConfig}>
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
      return <XStack bg="$background" h={top} />
    },
  }

  return (
    <Provider config={tamaguiConfig}>
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
                <Stack.Screen options={{ presentation: 'modal', ...headerModalOptions }} name="notifications/didcomm" />
                <Stack.Screen
                  options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTintColor: config.tokens.color['primary-500'].val,
                    headerTitle: '',
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
