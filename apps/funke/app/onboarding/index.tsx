import { Redirect } from 'expo-router'
import { Text, View } from 'react-native'

import { initializeAppAgent, useSecureUnlock } from '@/agent'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { WalletInvalidKeyError } from '@credo-ts/core'

/**
 * Onboarding screen is redirect to from app layout when app is not configured
 */
export default function Onboarding() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    // TODO: prevent multi-initialization
    if (secureUnlock.state !== 'acquired-wallet-key') return

    initializeAppAgent({
      walletKey: secureUnlock.walletKey,
    })
      .then((agent) => secureUnlock.setWalletKeyValid({ agent }))
      .catch((error) => {
        if (error instanceof WalletInvalidKeyError) {
          secureUnlock.setWalletKeyInvalid()
        }

        // TODO: handle other
        console.error(error)
      })
  }, [secureUnlock])

  // We want to wait until the agent is initialized before redirecting
  if (secureUnlock.state === 'acquired-wallet-key') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading ... onboarding</Text>
      </View>
    )
  }

  if (secureUnlock.state !== 'not-configured') {
    return <Redirect href="/" />
  }

  // TODO: where to put this?
  void SplashScreen.hideAsync()

  const onboarding = () => {
    secureUnlock.setup('123456')
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text onPress={onboarding}>Onboarding</Text>
    </View>
  )
}
