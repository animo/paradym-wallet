import { type AgentType, assertDidcommAgent, assertFullAgent, assertOpenId4VcAgent } from '../agent'
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
type ParadymUnlockedState<T extends AgentType = AgentType> = SecureUnlockReturnUnlocked<T>

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
export function useParadym<T extends AgentType = AgentType>(
  assertState: 'unlocked',
  agentType?: T
): ParadymUnlockedState<T>
export function useParadym<T extends AgentType = AgentType>(
  assertState?: ParadymState['state'],
  agentType?: T
): ParadymState {
  const unlock = useSecureUnlock()

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
    if (agentType === 'didcomm') {
      assertDidcommAgent(unlock.paradym.agent)
    }

    if (agentType === 'openid4vc') {
      assertOpenId4VcAgent(unlock.paradym.agent)
    }

    if (agentType === 'full') {
      assertFullAgent(unlock.paradym.agent)
    }

    // When the state changes to unlocked, we register the credentials for the digital credentials API
    void unlock.paradym.dcApi.registerCredentials()
    return unlock
  }

  throw new Error(`Invalid unlock state: '${JSON.stringify(unlock)}'`)
}
