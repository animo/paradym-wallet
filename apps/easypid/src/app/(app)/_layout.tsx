import { Redirect, Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router'

import { TypedArrayEncoder } from '@credo-ts/core'
import { useSecureUnlock } from '@easypid/agent'
import { mediatorDid } from '@easypid/constants'
import { activityStorage } from '@easypid/features/activity/activityRecord'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { resetWallet, useResetWalletDevMenu } from '@easypid/utils/resetWallet'
import { AgentProvider, type InvitationType, WalletJsonStoreProvider, useMediatorSetup } from '@package/agent'
import { isParadymAgent } from '@package/agent/src/agent'
import { type CredentialDataHandlerOptions, useHaptics, useHasInternetConnection } from '@package/app'
import { HeroIcons, IconContainer } from '@package/ui'
import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'

const jsonRecordIds = [activityStorage.recordId]

const isDIDCommEnabled = useFeatureFlag('DIDCOMM')

// When deeplink routing we want to push
export const credentialDataHandlerOptions = {
  routeMethod: 'push',
  allowedInvitationTypes: [
    'openid-credential-offer',
    'openid-authorization-request',
    ...(isDIDCommEnabled ? (['didcomm'] as InvitationType[]) : []),
  ],
} satisfies CredentialDataHandlerOptions

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()
  const theme = useTheme()
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const [redirectAfterUnlocked, setRedirectAfterUnlocked] = useState<string>()
  const pathname = usePathname()
  const params = useGlobalSearchParams()
  const hasInternetConnection = useHasInternetConnection()

  // It could be that the onboarding is cut of mid-process, and e.g. the user closes the app
  // if this is the case we will redo the onboarding
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const [hasResetWallet, setHasResetWallet] = useState(false)
  const shouldResetWallet =
    secureUnlock.state !== 'not-configured' && secureUnlock.state !== 'initializing' && !hasFinishedOnboarding
  const isWalletLocked = secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key'

  // Only setup mediation if the agent is a paradym agent
  useMediatorSetup({
    agent:
      secureUnlock.state === 'unlocked' && isParadymAgent(secureUnlock.context.agent) && isDIDCommEnabled
        ? secureUnlock.context.agent
        : undefined,
    hasInternetConnection,
    mediatorDid,
  })

  useEffect(() => {
    // Reset state
    if (hasResetWallet && !shouldResetWallet) {
      setHasResetWallet(false)
      return
    }
    if (!shouldResetWallet || hasResetWallet) return

    setHasResetWallet(true)
    resetWallet(secureUnlock)
  }, [secureUnlock, hasResetWallet, shouldResetWallet])

  // If we are initializing and the wallet was opened using a deeplink we will be redirected
  // to the authentication screen. We first save the redirection url and use that when navigation
  // to the auth screen
  if (
    (secureUnlock.state === 'initializing' || isWalletLocked) &&
    pathname &&
    pathname !== '/' &&
    !redirectAfterUnlocked
  ) {
    // Expo and urls as query params don't go well together, so we encoded the url as base64
    const encodedRedirect = TypedArrayEncoder.toBase64URL(
      TypedArrayEncoder.fromString(`${pathname}?${new URLSearchParams(params as Record<string, string>).toString()}`)
    )
    setRedirectAfterUnlocked(encodedRedirect)
  }

  // Clear the redirection in case the wallet is locked in the background
  if (secureUnlock.state !== 'initializing' && secureUnlock.state !== 'locked' && redirectAfterUnlocked) {
    setRedirectAfterUnlocked(undefined)
  }

  // This should show the splash screen
  if (secureUnlock.state === 'initializing' || shouldResetWallet) {
    return null
  }

  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  // We optionally pass an encoded redirect url that we should navigate to
  // after the user has unlocked the wallet
  if (isWalletLocked) {
    return (
      <Redirect
        href={redirectAfterUnlocked ? `/authenticate?redirectAfterUnlock=${redirectAfterUnlocked}` : '/authenticate'}
      />
    )
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            options={{
              presentation: 'modal',
            }}
            name="(home)/scan"
          />
          <Stack.Screen
            options={{
              presentation: 'modal',
            }}
            name="(home)/offline"
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
          <Stack.Screen
            name="notifications/offlinePresentation"
            options={{
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="notifications/didcomm"
            options={{
              gestureEnabled: false,
            }}
          />

          <Stack.Screen name="credentials/index" options={headerNormalOptions} />
          <Stack.Screen name="credentials/[id]/index" options={headerNormalOptions} />
          <Stack.Screen name="credentials/[id]/attributes" options={headerNormalOptions} />
          <Stack.Screen name="credentials/requestedAttributes" options={headerNormalOptions} />
          <Stack.Screen name="menu/index" options={headerNormalOptions} />
          <Stack.Screen name="menu/settings" options={headerNormalOptions} />
          <Stack.Screen name="menu/about" options={headerNormalOptions} />
          <Stack.Screen name="activity/index" options={headerNormalOptions} />
          <Stack.Screen name="activity/[id]" options={headerNormalOptions} />
          <Stack.Screen name="pinConfirmation" options={headerNormalOptions} />
          <Stack.Screen name="pinLocked" options={headerNormalOptions} />
          <Stack.Screen name="federation" options={headerNormalOptions} />
          <Stack.Screen name="pidSetup" />
        </Stack>
      </WalletJsonStoreProvider>
    </AgentProvider>
  )
}
