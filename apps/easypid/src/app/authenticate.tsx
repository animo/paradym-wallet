import { TypedArrayEncoder } from '@credo-ts/core'
import {
  WalletPinPromptHeader,
  WalletPinPromptInput,
  WalletUnlockPromptInput,
} from '@easypid/components/WalletPinPrompt'
import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { useShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import {
  clearWalletFlowAuthorization,
  getRedirectedWalletFlowAuthorizationRoute,
  isWalletAuthPromptError,
  setWalletFlowAuthorizationSession,
} from '@easypid/utils/authorizeWalletFlow'
import { useLingui } from '@lingui/react/macro'
import type { PinDotsInputRef } from '@package/app'
import { commonMessages } from '@package/translations'
import { FlexPage, HeroIcons, IconContainer, useDeviceMedia, useToastController, YStack } from '@package/ui'
import { useBiometricUnlockState, useParadym } from '@paradym/wallet-sdk'
import { Redirect, useLocalSearchParams } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { useResetWalletDevMenu } from '../hooks/useResetWalletDevMenu'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  useResetWalletDevMenu()
  const { t } = useLingui()

  const paradym = useParadym()

  const { redirectAfterUnlock } = useLocalSearchParams<{ redirectAfterUnlock?: string }>()
  const toast = useToastController()
  const pinInputRef = useRef<PinDotsInputRef>(null)
  const redirectedFlowPinRef = useRef<string | undefined>(undefined)
  const { additionalPadding, noBottomSafeArea } = useDeviceMedia()
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  const [shouldUseCloudHsmValue] = useShouldUseCloudHsm()
  const biometricUnlockState = useBiometricUnlockState()
  const redirectAfterUnlockUrl = redirectAfterUnlock
    ? TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64(redirectAfterUnlock))
    : undefined
  const redirectedFlowAuthorizationRoute = getRedirectedWalletFlowAuthorizationRoute(
    redirectAfterUnlockUrl,
    shouldUseCloudHsmValue === true
  )
  const shouldUsePinOnlyRedirectedFlowAuth = redirectedFlowAuthorizationRoute !== undefined
  const showBiometricUnlockAction =
    !shouldUsePinOnlyRedirectedFlowAuth &&
    biometricUnlockState.data?.canUnlockNow === true &&
    (paradym.state === 'locked' || (paradym.state === 'acquired-wallet-key' && paradym.unlockMethod === 'biometrics'))

  const isLoading =
    paradym.state === 'acquired-wallet-key' ||
    (paradym.state === 'locked' && paradym.isUnlocking) ||
    isInitializingAgent

  useEffect(() => {
    if (paradym.state === 'unlocked' && redirectAfterUnlock) {
      paradym.lock()
    }
  }, [])

  useEffect(() => {
    if (isInitializingAgent || paradym.state !== 'acquired-wallet-key') return

    setIsInitializingAgent(true)
    paradym
      .unlock()
      .then(async (sdk) => {
        await setupWalletServiceProvider(sdk)

        if (!redirectedFlowAuthorizationRoute || !redirectedFlowPinRef.current) {
          return
        }

        await setWalletServiceProviderPin(redirectedFlowPinRef.current, false)
        setWalletFlowAuthorizationSession(redirectedFlowAuthorizationRoute)
      })
      .catch((error) => {
        redirectedFlowPinRef.current = undefined
        clearWalletFlowAuthorization()

        if (isWalletAuthPromptError(error)) {
          pinInputRef.current?.clear()
          pinInputRef.current?.shake()
        }
      })
      .finally(() => setIsInitializingAgent(false))
  }, [paradym, isInitializingAgent, redirectedFlowAuthorizationRoute])

  if (paradym.state === 'unlocked') {
    // Expo and urls as query params don't go well together, so we encoded the url as base64
    const redirect = redirectAfterUnlockUrl ?? '/'

    return <Redirect href={redirect} />
  }

  if (paradym.state === 'not-configured' || paradym.state === 'initializing') {
    return <Redirect href="/" />
  }

  void SplashScreen.hideAsync()

  const unlockUsingBiometrics = async () => {
    if (paradym.state === 'locked') {
      await paradym.tryUnlockingUsingBiometrics()
    } else {
      toast.show(t({ id: 'authenticate.pinRequiredToast', message: 'Your PIN is required to unlock the app' }), {
        customData: {
          preset: 'danger',
        },
      })
    }
  }

  const unlockUsingPin = async (pin: string) => {
    if (paradym.state !== 'locked') return

    try {
      if (shouldUsePinOnlyRedirectedFlowAuth) redirectedFlowPinRef.current = pin
      await paradym.unlockUsingPin(pin)
    } catch (error) {
      redirectedFlowPinRef.current = undefined
      throw error
    }
  }

  return (
    <FlexPage flex-1 alignItems="center">
      <YStack fg={1} gap="$6" mb={noBottomSafeArea ? -additionalPadding : undefined}>
        <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$4">
          <WalletPinPromptHeader
            title={t(commonMessages.enterPin)}
            centerHeader
            headerIcon={<IconContainer h="$4" w="$4" ai="center" jc="center" icon={<HeroIcons.LockClosedFilled />} />}
            titleHeading="h2"
            titleFontWeight="$semiBold"
          />
        </YStack>
        {shouldUsePinOnlyRedirectedFlowAuth ? (
          <WalletPinPromptInput isLoading={isLoading} inputRef={pinInputRef} onPinComplete={unlockUsingPin} />
        ) : (
          <WalletUnlockPromptInput
            isLoading={isLoading}
            inputRef={pinInputRef}
            onPinComplete={unlockUsingPin}
            onBiometricsTap={unlockUsingBiometrics}
            showBiometricUnlockAction={showBiometricUnlockAction}
            autoPromptBiometrics={paradym.state === 'locked' && paradym.canTryUnlockingUsingBiometrics}
          />
        )}
      </YStack>
    </FlexPage>
  )
}
