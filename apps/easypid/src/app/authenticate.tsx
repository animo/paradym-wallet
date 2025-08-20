import { TypedArrayEncoder, WalletInvalidKeyError } from '@credo-ts/core'
import { useBiometricsType } from '@easypid/hooks/useBiometricsType'
import { useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { commonMessages } from '@package/translations'
import { FlexPage, Heading, HeroIcons, IconContainer, YStack, useDeviceMedia, useToastController } from '@package/ui'
import { useParadym, useResetWalletDevMenu } from '@paradym/wallet-sdk/hooks'
import { Redirect, useLocalSearchParams } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  useResetWalletDevMenu()
  const { t } = useLingui()

  const paradym = useParadym()

  const { redirectAfterUnlock } = useLocalSearchParams<{ redirectAfterUnlock?: string }>()
  const toast = useToastController()
  const biometricsType = useBiometricsType()
  const pinInputRef = useRef<PinDotsInputRef>(null)
  const { additionalPadding, noBottomSafeArea } = useDeviceMedia()
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  const [isAllowedToUnlockWithFaceId, setIsAllowedToUnlockWithFaceId] = useState(false)

  const isLoading = paradym.state === 'locked' && paradym.isUnlocking

  // biome-ignore lint/correctness/useExhaustiveDependencies: no recheck required, only on mount
  useEffect(() => {
    if (paradym.state === 'unlocked' && redirectAfterUnlock) {
      paradym.lock()
    }
  }, [])

  // After resetting the wallet, we want to avoid prompting for face id immediately
  // So we add an artificial delay
  useEffect(() => {
    const timer = setTimeout(() => setIsAllowedToUnlockWithFaceId(true), 500)

    return () => clearTimeout(timer)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: canTryUnlockingUsingBiometrics not needed
  useEffect(() => {
    if (paradym.state === 'locked' && paradym.canTryUnlockingUsingBiometrics && isAllowedToUnlockWithFaceId) {
      paradym.tryUnlockingUsingBiometrics()
    }
  }, [paradym.state, isAllowedToUnlockWithFaceId])

  useEffect(() => {
    if (isInitializingAgent || paradym.state !== 'acquired-wallet-key') return

    setIsInitializingAgent(true)

    paradym
      .unlock()
      .catch((error) => {
        if (error instanceof WalletInvalidKeyError) {
          pinInputRef.current?.clear()
          pinInputRef.current?.shake()
        }
        console.error(error)
      })
      .finally(() => {
        setIsInitializingAgent(false)
      })
  }, [paradym, isInitializingAgent])

  if (paradym.state === 'unlocked') {
    // Expo and urls as query params don't go well together, so we encoded the url as base64
    const redirect = redirectAfterUnlock
      ? TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64(redirectAfterUnlock))
      : '/'

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
    await paradym.unlockUsingPin(pin)
  }

  return (
    <FlexPage flex-1 alignItems="center">
      <YStack fg={1} gap="$6" mb={noBottomSafeArea ? -additionalPadding : undefined}>
        <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$4">
          <IconContainer h="$4" w="$4" ai="center" jc="center" icon={<HeroIcons.LockClosedFilled />} />
          <Heading heading="h2" fontWeight="$semiBold">
            {t(commonMessages.enterPin)}
          </Heading>
        </YStack>
        <PinDotsInput
          isLoading={isLoading}
          ref={pinInputRef}
          pinLength={6}
          onPinComplete={unlockUsingPin}
          onBiometricsTap={unlockUsingBiometrics}
          useNativeKeyboard={false}
          biometricsType={biometricsType ?? 'fingerprint'}
        />
      </YStack>
    </FlexPage>
  )
}
