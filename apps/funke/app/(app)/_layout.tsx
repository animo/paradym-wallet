import { Text } from 'react-native'
import { Redirect, Stack } from 'expo-router'

import { useSecureUnlock } from '../_layout'
import { AgentProvider } from '@package/agent'

export default function AppLayout() {
  const secureUnlock = useSecureUnlock()

  // Wallet is not configured yet. Redirect to onboarding
  if (secureUnlock.state === 'not-configured') {
    return <Redirect href="/onboarding" />
  }

  // Wallet is locked. Redirect to authentication screen
  if (secureUnlock.state === 'locked') {
    return <Redirect href="/authenticate" />
  }

  // This should show the splash screen
  if (secureUnlock.state === 'initializing') {
    return <Text>Loading... initializing</Text>
  }

  if (!secureUnlock.context.agent) {
    // TODO: what to do? Should be set by authentication or onboarding
    // Probably authenticate again?
    return <Text>Loading... missing agent</Text>
  }

  // Render the normal wallet, which is everything inside (app)
  return (
    <AgentProvider agent={secureUnlock.context.agent}>
      <Stack />
    </AgentProvider>
  )
}
