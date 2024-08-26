import { Redirect, Stack, useRouter } from 'expo-router'

import { useSecureUnlock } from '@easypid/agent'
import { activityStorage } from '@easypid/features/activity/activityRecord'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { seedCredentialStorage } from '@easypid/storage'
import { resetWallet, useResetWalletDevMenu } from '@easypid/utils/resetWallet'
import { AgentProvider, WalletJsonStoreProvider } from '@package/agent'
import { type CredentialDataHandlerOptions, DeeplinkHandler, useScaleAnimation } from '@package/app'
import { HeroIcons, XStack } from '@package/ui'
import { useEffect, useState } from 'react'
import Reanimated, { FadeIn } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { useTheme } from 'tamagui'

const jsonRecordIds = [seedCredentialStorage.recordId, activityStorage.recordId]

// When deeplink routing we want to push
export const credentialDataHandlerOptions = {
  allowedInvitationTypes: ['openid-authorization-request'],
  routeMethod: 'push',
} satisfies CredentialDataHandlerOptions

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()
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

  const { handlePressIn, handlePressOut, pressStyle } = useScaleAnimation({ scaleInValue: 0.9 })

  const headerNormalOptions = {
    headerShown: true,
    headerTransparent: true,
    headerTintColor: theme['primary-500'].val,
    headerTitle: '',
    headerLeft: () => (
      <Animated.View style={pressStyle}>
        <XStack
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => router.back()}
          p="$2"
          ml={-4}
          ai="center"
        >
          <HeroIcons.ArrowLeft size={28} color="$black" />
        </XStack>
      </Animated.View>
    ),
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
      <WalletJsonStoreProvider agent={secureUnlock.context.agent} recordIds={jsonRecordIds}>
        <DeeplinkHandler credentialDataHandlerOptions={credentialDataHandlerOptions}>
          <Reanimated.View
            style={{ flex: 1 }}
            entering={FadeIn.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(800)}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                options={{
                  presentation: 'modal',
                }}
                name="(home)/scan"
              />
              <Stack.Screen name="notifications/openIdPresentation" />
              <Stack.Screen name="credentials/pid" options={headerNormalOptions} />
              <Stack.Screen name="credentials/pidRequestedAttributes" options={headerNormalOptions} />
              <Stack.Screen name="menu/index" options={headerNormalOptions} />
              <Stack.Screen name="menu/feedback" options={headerNormalOptions} />
              <Stack.Screen name="menu/settings" options={headerNormalOptions} />
              <Stack.Screen name="menu/about" options={headerNormalOptions} />
              <Stack.Screen name="activity/index" options={headerNormalOptions} />
              <Stack.Screen name="activity/[id]" options={headerNormalOptions} />
              <Stack.Screen name="pinConfirmation" options={headerNormalOptions} />
            </Stack>
          </Reanimated.View>
        </DeeplinkHandler>
      </WalletJsonStoreProvider>
    </AgentProvider>
  )
}
