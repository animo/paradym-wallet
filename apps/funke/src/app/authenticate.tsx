import { Redirect } from 'expo-router'
import { KeyboardAvoidingView } from 'react-native'

import { initializeAppAgent, useSecureUnlock } from '@funke/agent'
import { WalletInvalidKeyError } from '@credo-ts/core'
import { HeroIcons, Paragraph, PinDotsInput, type PinDotsInputRef, FlexPage, YStack } from '@package/ui'
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
      .then((agent) => secureUnlock.setWalletKeyValid({ agent }))
      .catch((error) => {
        if (error instanceof WalletInvalidKeyError) {
          secureUnlock.setWalletKeyInvalid()
          pinInputRef.current?.clear()
          pinInputRef.current?.shake()
          pinInputRef.current?.focus()
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

  // TODO: where to put this?
  void SplashScreen.hideAsync()

  const unlockUsingPin = async (pin: string) => {
    if (secureUnlock.state !== 'locked') return
    await secureUnlock.unlockUsingPin(pin)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <FlexPage>
        <YStack flex-1 gap="$4" alignItems="center" justifyContent="center">
          <Circle size="$3" backgroundColor="$grey-100">
            <HeroIcons.LockClosed color="$grey-700" />
          </Circle>
          <Paragraph>Enter your app pin code</Paragraph>
          <PinDotsInput
            isLoading={isLoading}
            ref={pinInputRef}
            autoFocus
            pinLength={6}
            onPinComplete={unlockUsingPin}
          />
        </YStack>
      </FlexPage>
    </KeyboardAvoidingView>
  )
}
