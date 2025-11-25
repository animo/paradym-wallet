import { TypedArrayEncoder } from '@credo-ts/core'
import { initializeAppAgent, useSecureUnlock } from '@easypid/agent'
import { useBiometricsType } from '@easypid/hooks/useBiometricsType'
import { useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import { commonMessages } from '@package/translations'
import { FlexPage, Heading, HeroIcons, IconContainer, YStack, useDeviceMedia, useToastController } from '@package/ui'
import { isDevice } from 'expo-device'
import { Redirect, useLocalSearchParams } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { InvalidPinError } from '../crypto/error'
import { useResetWalletDevMenu } from '../utils/resetWallet'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  useResetWalletDevMenu()

  const { redirectAfterUnlock } = useLocalSearchParams<{ redirectAfterUnlock?: string }>()
  const toast = useToastController()
  const secureUnlock = useSecureUnlock()
  const biometricsType = useBiometricsType()
  const pinInputRef = useRef<PinDotsInputRef>(null)
  const { additionalPadding, noBottomSafeArea } = useDeviceMedia()
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  const [isAllowedToUnlockWithFaceId, setIsAllowedToUnlockWithFaceId] = useState(false)
  const { t } = useLingui()

  const isLoading =
    secureUnlock.state === 'acquired-wallet-key' || (secureUnlock.state === 'locked' && secureUnlock.isUnlocking)

  // biome-ignore lint/correctness/useExhaustiveDependencies: no recheck required, only on mount
  useEffect(() => {
    if (secureUnlock.state === 'unlocked' && redirectAfterUnlock) {
      secureUnlock.lock()
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
    if (
      secureUnlock.state === 'locked' &&
      secureUnlock.canTryUnlockingUsingBiometrics &&
      isAllowedToUnlockWithFaceId &&
      isDevice
    ) {
      secureUnlock.tryUnlockingUsingBiometrics()
    }
  }, [secureUnlock.state, isAllowedToUnlockWithFaceId])

  useEffect(() => {
    if (secureUnlock.state !== 'acquired-wallet-key') return
    if (isInitializingAgent) return

    setIsInitializingAgent(true)
    initializeAppAgent({
      walletKey: secureUnlock.walletKey,
      walletKeyVersion: secureWalletKey.getWalletKeyVersion(),
    })
      .then((agent) => secureUnlock.setWalletKeyValid({ agent }, { enableBiometrics: true }))
      .catch((error) => {
        if (error instanceof InvalidPinError) {
          secureUnlock.setWalletKeyInvalid()
          pinInputRef.current?.clear()
          pinInputRef.current?.shake()
        }

        // TODO: handle other
        console.error(error)
      })
      .finally(() => {
        setIsInitializingAgent(false)
      })
  }, [secureUnlock, isInitializingAgent])

  if (secureUnlock.state === 'unlocked') {
    // Expo and urls as query params don't go well together, so we encoded the url as base64
    const redirect = redirectAfterUnlock
      ? TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64(redirectAfterUnlock))
      : '/'

    return <Redirect href={redirect} />
  }

  if (secureUnlock.state === 'initializing' || secureUnlock.state === 'not-configured') {
    return <Redirect href="/" />
  }

  void SplashScreen.hideAsync()

  const unlockUsingBiometrics = async () => {
    if (secureUnlock.state === 'locked' && isDevice) {
      secureUnlock.tryUnlockingUsingBiometrics()
    } else {
      toast.show(t({ id: 'authenticate.pinRequiredToast', message: 'Your PIN is required to unlock the app' }), {
        customData: {
          preset: 'danger',
        },
      })
    }
  }

  const unlockUsingPin = async (pin: string) => {
    if (secureUnlock.state !== 'locked') return
    await secureUnlock.unlockUsingPin(pin)
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
