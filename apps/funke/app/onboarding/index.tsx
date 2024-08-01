import { Redirect } from 'expo-router'
import { Text, View } from 'react-native'

import { useSecureUnlock } from '../_layout'
import { useEffect } from 'react'
import { initializeAppAgent } from '../(app)'
import * as SplashScreen from 'expo-splash-screen'
import { secureUnlockVersion } from '../../../../packages/secure-store/secure-unlock/version'

/**
 * Onboarding screen is redirect to from app layout when app is not configured
 */
export default function Onboarding() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    // TODO: prevent multi-initialization
    if (secureUnlock.state !== 'unlocked') return

    initializeAppAgent({
      keyDerivation: 'raw',
      walletId: `funke-wallet-${secureUnlockVersion}`,
      walletKey: secureUnlock.walletKey,
      walletLabel: 'Funke Wallet',
    }).then((agent) => secureUnlock.setContext({ agent }))
  }, [secureUnlock])

  // We want to wait until the agent is initialized before redirecting
  if (secureUnlock.state === 'unlocked' && !secureUnlock.context.agent) {
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
    secureUnlock.setup('123456', {
      storeUsingBiometrics: true,
    })
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text onPress={onboarding}>Onboarding</Text>
    </View>
  )
}
