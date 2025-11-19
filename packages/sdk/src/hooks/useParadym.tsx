import { assertDidcommAgent, assertOpenId4VcAgent, type DidCommAgent, type OpenId4VcAgent } from '../agent'
import {
  type SecureUnlockReturnInitializing,
  type SecureUnlockReturnLocked,
  type SecureUnlockReturnNotConfigured,
  type SecureUnlockReturnUnlocked,
  type SecureUnlockReturnWalletKeyAcquired,
  useSecureUnlock,
} from '../ParadymWalletSdk'

type ParadymLoadingState = SecureUnlockReturnInitializing
type ParadymNotConfiguredState = SecureUnlockReturnNotConfigured
type ParadymAcquiredWalletKeyState = SecureUnlockReturnWalletKeyAcquired
type ParadymLockedState = SecureUnlockReturnLocked
type ParadymUnlockedState = SecureUnlockReturnUnlocked

export type ParadymState =
  | ParadymLoadingState
  | ParadymNotConfiguredState
  | ParadymAcquiredWalletKeyState
  | ParadymLockedState
  | ParadymUnlockedState

export function useParadym(): ParadymState
export function useParadym(assertState: 'initializing'): ParadymLoadingState
export function useParadym(assertState: 'not-configured'): ParadymNotConfiguredState
export function useParadym(assertState: 'acquired-wallet-key'): ParadymAcquiredWalletKeyState
export function useParadym(assertState: 'locked'): ParadymLockedState
export function useParadym(assertState: 'unlocked', agentType?: 'didcomm' | 'openid4vc'): ParadymUnlockedState
export function useParadym(assertState?: ParadymState['state'], agentType?: 'didcomm' | 'openid4vc'): ParadymState {
  const unlock = useSecureUnlock()

  // useDidCommMediatorSetup({ paradym: unlock.state === 'unlocked' ? unlock.paradym : undefined })

  if (assertState && unlock.state !== assertState) {
    throw new Error(`Unlock state '${unlock.state}' did not match the asserted state of '${assertState}'`)
  }

  if (unlock.state === 'initializing') {
    return unlock
  }

  if (unlock.state === 'not-configured') {
    return unlock
  }

  if (unlock.state === 'acquired-wallet-key') {
    return unlock
  }

  if (unlock.state === 'locked') {
    return unlock
  }

  if (unlock.state === 'unlocked') {
    if (agentType && agentType === 'didcomm') {
      assertDidcommAgent(unlock.paradym.agent as unknown as DidCommAgent)
    }

    if (agentType && agentType === 'openid4vc') {
      assertOpenId4VcAgent(unlock.paradym.agent as unknown as OpenId4VcAgent)
    }

    // When the state changes to unlocked, we register the credentials for the digital credentials API
    void unlock.paradym.dcApi.registerCredentials()
    return unlock
  }

  throw new Error(`Invalid unlock state: '${JSON.stringify(unlock)}'`)
}
