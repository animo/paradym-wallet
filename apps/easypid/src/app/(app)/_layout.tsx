import { Redirect, Stack, useRouter } from 'expo-router'

import { useSecureUnlock } from '@easypid/agent'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { resetWallet, useResetWalletDevMenu } from '@easypid/utils/resetWallet'
import { AgentProvider } from '@package/agent'
import { DeeplinkHandler, isAndroid } from '@package/app'
import { HeroIcons, XStack } from '@package/ui'
import { useEffect, useState } from 'react'
import Reanimated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()
  const { top } = useSafeAreaInsets()
  const theme = useTheme()
  const router = useRouter()

  // It could be that the onboarding is cut of mid-process, and e.g. the user closes the app
  // if this is the case we will redo the onboarding
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const [resetWalletState, setResetWalletState] = useState<'resetting' | 'reset'>()
  const shouldResetWallet =
    secureUnlock.state !== 'not-configured' && secureUnlock.state !== 'initializing' && !hasFinishedOnboarding

  useEffect(() => {
    if (resetWalletState || !shouldResetWallet) return

    setResetWalletState('resetting')
    resetWallet(secureUnlock).then(() => setResetWalletState('reset'))
  }, [secureUnlock, resetWalletState, shouldResetWallet])

  // This should show the splash screen
  if (secureUnlock.state === 'initializing' || (shouldResetWallet && resetWalletState !== 'reset')) {
    return null
  }

  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  if (secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key') {
    return <Redirect href="/authenticate" />
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
      <DeeplinkHandler allowedInvitationTypes={['openid-authorization-request']}>
        <Reanimated.View
          style={{ flex: 1 }}
          entering={FadeIn.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(200)}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              options={{
                presentation: 'modal',
                // Extra modal options not needed for QR Scanner
              }}
              name="(home)/scan"
            />
            <Stack.Screen
              // options={{ presentation: 'modal', ...headerModalOptions }}
              name="notifications/openIdPresentation"
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
        </Reanimated.View>
      </DeeplinkHandler>
    </AgentProvider>
  )
}
