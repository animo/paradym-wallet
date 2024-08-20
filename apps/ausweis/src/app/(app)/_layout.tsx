import { Redirect, Stack, useRouter } from 'expo-router'

import { useSecureUnlock } from '@ausweis/agent'
import { AgentProvider } from '@package/agent'
import { useResetWalletDevMenu } from '../../utils/resetWallet'
import { isAndroid } from '@package/app'
import { HeroIcons, XStack } from '@package/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()
  const { top } = useSafeAreaInsets()
  const theme = useTheme()
  const router = useRouter()

  // Wallet is not configured yet. Redirect to onboarding
  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  if (secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key') {
    return <Redirect href="/authenticate" />
  }

  // This should show the splash screen
  if (secureUnlock.state === 'initializing') {
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

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
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
          name="notifications/openIdPresentation"
        />
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTintColor: theme['primary-500'].val,
            headerTitle: '',
            headerLeft: () => (
              <XStack onPress={() => router.back()}>
                <HeroIcons.ArrowLeft size={32} color="$black" />
              </XStack>
            ),
          }}
          name="credentials/pid"
        />
      </Stack>
    </AgentProvider>
  )
}
