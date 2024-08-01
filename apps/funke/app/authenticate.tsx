import { Redirect } from 'expo-router'
import { Text, View } from 'react-native'

import { initializeAppAgent, useSecureUnlock } from '@/agent'
import type { SecureUnlockMethod } from '@package/secure-store/secureUnlock'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

/**
 * Authenticate screen is redirect to from app layout when app is configured but locked
 */
export default function Authenticate() {
  const secureUnlock = useSecureUnlock()

  useEffect(() => {
    // TODO: prevent multi-initialization
    if (secureUnlock.state !== 'unlocked') return

    initializeAppAgent({
      walletKey: secureUnlock.walletKey,
    }).then((agent) => secureUnlock.setContext({ agent }))
  }, [secureUnlock])

  // We want to wait until the agent is initialized before redirecting
  if (secureUnlock.state === 'unlocked' && !secureUnlock.context.agent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading ... authenticating</Text>
      </View>
    )
  }

  if (secureUnlock.state !== 'locked') {
    return <Redirect href="/" />
  }

  // TODO: where to put this?
  void SplashScreen.hideAsync()

  const unlock = async (method: SecureUnlockMethod) => {
    if (method === 'biometrics') {
      await secureUnlock.tryUnlockingUsingBiometrics()
    } else {
      await secureUnlock.unlockUsingPin('123456')
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {secureUnlock.canTryUnlockingUsingBiometrics && (
        <Text onPress={() => unlock('biometrics')}>Unlock using biometrics</Text>
      )}

      <Text onPress={() => unlock('pin')}>Unlock using pin</Text>
    </View>
  )
}
