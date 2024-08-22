import { Redirect, Stack } from 'expo-router'

import { useSecureUnlock } from '@ausweis/agent'
import { useHasFinishedOnboarding } from '@ausweis/features/onboarding'
import { resetWallet, useResetWalletDevMenu } from '@ausweis/utils/resetWallet'
import { AgentProvider } from '@package/agent'
import { useEffect, useState } from 'react'
import Reanimated, { FadeIn } from 'react-native-reanimated'

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()

  // It could be that the onboarding is cut of mid-process, and e.g. the user closes the app
  // if this is the case we will redo the onboarding
  const [hasFinishedOnboarding] = useHasFinishedOnboarding()
  const [resetWalletState, setResetWalletState] = useState<'resetting' | 'reset'>()
  const shouldResetWallet =
    secureUnlock.state !== 'not-configured' && secureUnlock.state !== 'initializing' && !hasFinishedOnboarding

  useEffect(() => {
    if (resetWalletState || !shouldResetWallet) return

    setResetWalletState('resetting')
    resetWallet(secureUnlock).then(() => setResetWalletState('reset'))
  }, [secureUnlock, resetWalletState, shouldResetWallet])

  // This should show the splash screen
  if (secureUnlock.state === 'initializing' || (shouldResetWallet && resetWalletState !== 'reset')) {
    return null
  }

  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  if (secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key') {
    return <Redirect href="/authenticate" />
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
      <Reanimated.View
        style={{ flex: 1 }}
        entering={FadeIn.springify().damping(24).mass(0.8).stiffness(200).restSpeedThreshold(0.05).delay(200)}
      >
        <Stack />
      </Reanimated.View>
    </AgentProvider>
  )
}
