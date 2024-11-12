import { Redirect, Stack, useRouter } from 'expo-router'

import { useSecureUnlock } from '@easypid/agent'
import { activityStorage } from '@easypid/features/activity/activityRecord'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { seedCredentialStorage } from '@easypid/storage'
import { resetWallet, useResetWalletDevMenu } from '@easypid/utils/resetWallet'
import { AgentProvider, WalletJsonStoreProvider } from '@package/agent'
import { type CredentialDataHandlerOptions, DeeplinkHandler, useHaptics } from '@package/app'
import { HeroIcons, IconContainer } from '@package/ui'
import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'

const jsonRecordIds = [seedCredentialStorage.recordId, activityStorage.recordId]

// When deeplink routing we want to push
export const credentialDataHandlerOptions = {
  routeMethod: 'push',
} satisfies CredentialDataHandlerOptions

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()
  const theme = useTheme()
  const router = useRouter()
  const { withHaptics } = useHaptics()

  // It could be that the onboarding is cut of mid-process, and e.g. the user closes the app
  // if this is the case we will redo the onboarding
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const [resetWalletState, setResetWalletState] = useState<'resetting' | 'reset'>()
  const shouldResetWallet =
    secureUnlock.state !== 'not-configured' && secureUnlock.state !== 'initializing' && !hasFinishedOnboarding
  const isWalletLocked = secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key'

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
  if (isWalletLocked) {
    return <Redirect href="/authenticate" />
  }

  const headerNormalOptions = {
    headerShown: true,
    headerTransparent: true,
    headerTintColor: theme['primary-500'].val,
    headerTitle: '',
    headerLeft: () => <IconContainer icon={<HeroIcons.ArrowLeft />} onPress={withHaptics(() => router.back())} />,
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
      <WalletJsonStoreProvider agent={secureUnlock.context.agent} recordIds={jsonRecordIds}>
        <DeeplinkHandler credentialDataHandlerOptions={credentialDataHandlerOptions}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              options={{
                presentation: 'modal',
              }}
              name="(home)/scan"
            />
            <Stack.Screen
              name="notifications/openIdPresentation"
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="notifications/openIdCredential"
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="credentials/[id]/index" options={headerNormalOptions} />
            <Stack.Screen name="credentials/[id]/attributes" options={headerNormalOptions} />
            <Stack.Screen name="credentials/requestedAttributes" options={headerNormalOptions} />
            <Stack.Screen name="menu/index" options={headerNormalOptions} />
            <Stack.Screen name="menu/feedback" options={headerNormalOptions} />
            <Stack.Screen name="menu/settings" options={headerNormalOptions} />
            <Stack.Screen name="menu/about" options={headerNormalOptions} />
            <Stack.Screen name="activity/index" options={headerNormalOptions} />
            <Stack.Screen name="activity/[id]" options={headerNormalOptions} />
            <Stack.Screen name="pinConfirmation" options={headerNormalOptions} />
            <Stack.Screen name="pinLocked" options={headerNormalOptions} />
            <Stack.Screen name="issuer" options={headerNormalOptions} />
            <Stack.Screen name="pidSetup" />
          </Stack>
        </DeeplinkHandler>
      </WalletJsonStoreProvider>
    </AgentProvider>
  )
}
