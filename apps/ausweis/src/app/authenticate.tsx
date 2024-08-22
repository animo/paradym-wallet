import { Redirect } from 'expo-router'

import { initializeAppAgent, useSecureUnlock } from '@ausweis/agent'
import { WalletInvalidKeyError } from '@credo-ts/core'
import { FlexPage, HeroIcons, Paragraph, PinDotsInput, type PinDotsInputRef, Stack, YStack } from '@package/ui'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef } from 'react'
import { Circle } from 'tamagui'
import { useResetWalletDevMenu } from '../utils/resetWallet'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  useResetWalletDevMenu()

  const secureUnlock = useSecureUnlock()
  const pinInputRef = useRef<PinDotsInputRef>(null)
  const isLoading =
    secureUnlock.state === 'acquired-wallet-key' || (secureUnlock.state === 'locked' && secureUnlock.isUnlocking)

  useEffect(() => {
    if (secureUnlock.state === 'locked' && secureUnlock.canTryUnlockingUsingBiometrics) {
      secureUnlock.tryUnlockingUsingBiometrics()
    }
  }, [secureUnlock])

  useEffect(() => {
    if (secureUnlock.state !== 'acquired-wallet-key') return

    initializeAppAgent({
      walletKey: secureUnlock.walletKey,
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
  }, [secureUnlock])

  if (
    secureUnlock.state === 'initializing' ||
    secureUnlock.state === 'not-configured' ||
    secureUnlock.state === 'unlocked'
  ) {
    return <Redirect href="/" />
  }

  void SplashScreen.hideAsync()

  const unlockUsingPin = async (pin: string) => {
    if (secureUnlock.state !== 'locked') return
    await secureUnlock.unlockUsingPin(pin)
  }

  return (
    <FlexPage flex-1 safeArea="y" gap={0} alignItems="center">
      <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$2">
        <Circle size="$3" backgroundColor="$grey-100">
          <HeroIcons.LockClosed color="$grey-700" />
        </Circle>
        <Paragraph>Enter your app pin code</Paragraph>
      </YStack>
      <PinDotsInput
        isLoading={isLoading}
        ref={pinInputRef}
        pinLength={6}
        onPinComplete={unlockUsingPin}
        useNativeKeyboard={false}
      />
    </FlexPage>
  )
}
