import { Redirect, Stack } from 'expo-router'

import { useSecureUnlock } from '@ausweis/agent'
import { AgentProvider } from '@package/agent'
import { useResetWalletDevMenu } from '../../utils/resetWallet'

export default function AppLayout() {
  useResetWalletDevMenu()
  const secureUnlock = useSecureUnlock()

  // Wallet is not configured yet. Redirect to onboarding
  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  if (secureUnlock.state === 'locked' || secureUnlock.state === 'acquired-wallet-key') {
    return <Redirect href="/authenticate" />
  }

  // This should show the splash screen
  if (secureUnlock.state === 'initializing') {
    return null
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
      <Stack />
    </AgentProvider>
  )
}
