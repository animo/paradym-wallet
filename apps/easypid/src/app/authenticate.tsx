import { Redirect } from 'expo-router'

import { WalletInvalidKeyError } from '@credo-ts/core'
import { initializeAppAgent, useSecureUnlock } from '@easypid/agent'
import { useBiometricsType } from '@easypid/hooks/useBiometricsType'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import {
  FlexPage,
  Heading,
  HeroIcons,
  PinDotsInput,
  type PinDotsInputRef,
  YStack,
  useToastController,
} from '@package/ui'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import { Circle } from 'tamagui'
import { useResetWalletDevMenu } from '../utils/resetWallet'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  useResetWalletDevMenu()

  const toast = useToastController()
  const secureUnlock = useSecureUnlock()
  const biometricsType = useBiometricsType()
  const pinInputRef = useRef<PinDotsInputRef>(null)
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  const isLoading =
    secureUnlock.state === 'acquired-wallet-key' || (secureUnlock.state === 'locked' && secureUnlock.isUnlocking)

  // biome-ignore lint/correctness/useExhaustiveDependencies: canTryUnlockingUsingBiometrics not needed
  useEffect(() => {
    if (secureUnlock.state === 'locked' && secureUnlock.canTryUnlockingUsingBiometrics) {
      secureUnlock.tryUnlockingUsingBiometrics()
    }
  }, [])

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
        if (error instanceof WalletInvalidKeyError) {
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

  if (
    secureUnlock.state === 'initializing' ||
    secureUnlock.state === 'not-configured' ||
    secureUnlock.state === 'unlocked'
  ) {
    return <Redirect href="/" />
  }

  void SplashScreen.hideAsync()

  const unlockUsingBiometrics = async () => {
    if (secureUnlock.state === 'locked') {
      secureUnlock.tryUnlockingUsingBiometrics()
    } else {
      toast.show('You PIN is required to unlock the app', {
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
    <FlexPage flex-1 safeArea="y" alignItems="center">
      <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$4">
        <Circle size="$4" backgroundColor="$grey-100">
          <HeroIcons.LockClosed strokeWidth={2} color="$grey-700" />
        </Circle>
        <Heading variant="h2" fontWeight="$semiBold">
          Enter your app PIN code
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
    </FlexPage>
  )
}
