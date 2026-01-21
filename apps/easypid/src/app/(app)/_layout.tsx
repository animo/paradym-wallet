import { TypedArrayEncoder } from '@credo-ts/core'
import { useHasFinishedOnboarding } from '@easypid/features/onboarding'
import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { useResetWalletDevMenu } from '@easypid/hooks/useResetWalletDevMenu'
import { type CredentialDataHandlerOptions, useHaptics } from '@package/app'
import { HeroIcons, IconContainer } from '@package/ui'
import type { InvitationType } from '@paradym/wallet-sdk'
import { activityStorage, deferredCredentialStorage, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
import { Redirect, Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable } from 'react-native-gesture-handler'
import { useTheme } from 'tamagui'

const jsonRecordIds = [activityStorage.recordId, deferredCredentialStorage.recordId]

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

  const paradym = useParadym()

  const theme = useTheme()
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const [redirectAfterUnlocked, setRedirectAfterUnlocked] = useState<string>()
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  // It could be that the onboarding is cut of mid-process, and e.g. the user closes the app
  // if this is the case we will redo the onboarding
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const shouldResetWallet =
    paradym.state !== 'not-configured' && paradym.state !== 'initializing' && !hasFinishedOnboarding
  const isWalletLocked = paradym.state === 'locked' || paradym.state === 'acquired-wallet-key'

  // If we are initializing and the wallet was opened using a deeplink we will be redirected
  // to the authentication screen. We first save the redirection url and use that when navigation
  // to the auth screen
  if ((paradym.state === 'initializing' || isWalletLocked) && pathname && pathname !== '/' && !redirectAfterUnlocked) {
    // Expo and urls as query params don't go well together, so we encoded the url as base64
    const encodedRedirect = TypedArrayEncoder.toBase64URL(
      TypedArrayEncoder.fromString(`${pathname}?${new URLSearchParams(params as Record<string, string>).toString()}`)
    )
    setRedirectAfterUnlocked(encodedRedirect)
  }

  // Clear the redirection in case the wallet is locked in the background
  if (paradym.state !== 'initializing' && paradym.state !== 'locked' && redirectAfterUnlocked) {
    setRedirectAfterUnlocked(undefined)
  }

  if (paradym.state === 'not-configured' || shouldResetWallet) {
    return <Redirect href={`/onboarding?reset=${shouldResetWallet}`} />
  }

  // This should show the splash screen
  if (paradym.state === 'initializing') {
    return null
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
    headerLeft: () => (
      // FIXME: should remove pressable and pass it to IconContainer once
      // the following issue is resolved:
      // https://github.com/react-navigation/react-navigation/issues/12667
      <Pressable onPress={withHaptics(() => router.back())} style={{ padding: 2 }}>
        <IconContainer icon={<HeroIcons.ArrowLeft />} />
      </Pressable>
    ),
    headerTransparent: true,
    headerBackVisible: false,
    headerTintColor: theme['primary-500'].val,
    headerTitle: '',
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <ParadymWalletSdk.AppProvider recordIds={jsonRecordIds}>
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

        <Stack.Screen name="notifications/deferredCredential" options={headerNormalOptions} />
        <Stack.Screen name="credentials/index" options={headerNormalOptions} />
        <Stack.Screen name="credentials/[id]/index" options={headerNormalOptions} />
        <Stack.Screen name="credentials/[id]/attributes" options={headerNormalOptions} />
        <Stack.Screen name="credentials/[id]/nested" options={headerNormalOptions} />
        <Stack.Screen name="credentials/requestedAttributes" options={headerNormalOptions} />
        <Stack.Screen name="menu/index" options={headerNormalOptions} />
        <Stack.Screen name="menu/settings" options={headerNormalOptions} />
        <Stack.Screen name="menu/about" options={headerNormalOptions} />
        <Stack.Screen name="activity/index" options={headerNormalOptions} />
        <Stack.Screen name="activity/[id]" options={headerNormalOptions} />
        <Stack.Screen name="pinConfirmation" options={headerNormalOptions} />
        <Stack.Screen name="pinLocked" options={headerNormalOptions} />
        <Stack.Screen name="trust" options={headerNormalOptions} />
        <Stack.Screen name="pidSetup" />
        <Stack.Screen name="inbox" options={headerNormalOptions} />
      </Stack>
    </ParadymWalletSdk.AppProvider>
  )
}
