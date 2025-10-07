import { registerCredentialsForDcApi } from '../openid4vc/dcApi'
import {
  type SecureUnlockReturnInitializing,
  type SecureUnlockReturnLocked,
  type SecureUnlockReturnNotConfigured,
  type SecureUnlockReturnUnlocked,
  type SecureUnlockReturnWalletKeyAcquired,
  useSecureUnlock,
} from '../secure'
import { useDidCommMediatorSetup } from './useDidCommMediatorSetup'

type ParadymLoadingState = SecureUnlockReturnInitializing /*{
  state: 'loading'
}*/

type ParadymNotConfiguredState = SecureUnlockReturnNotConfigured /*{
  state: 'not-configured'
  setup: (pin: string) => Promise<void>
  reinitialize: () => void
}*/

type ParadymAcquiredWalletKeyState = SecureUnlockReturnWalletKeyAcquired /*{
  state: 'acquired-wallet-key'
  unlockMethod: UnlockMethod
  unlock: (options?: { enableBiometrics: boolean }) => Promise<void>
  reinitialize: () => void
}*/

type ParadymLockedState = SecureUnlockReturnLocked /*{
  state: 'locked'
  canTryUnlockingUsingBiometrics: boolean
  isUnlocking: boolean
  tryUnlockingUsingBiometrics: () => Promise<void>
  unlockUsingPin: (pin: string) => Promise<void>
  reinitialize: () => void
}*/

type ParadymUnlockedState = SecureUnlockReturnUnlocked /*{
  state: 'unlocked'
  unlockMethod: UnlockMethod
  lock: () => Promise<void>
  paradym: ParadymWalletSdk
  reinitialize: () => void
}*/

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
export function useParadym(assertState: 'unlocked'): ParadymUnlockedState
export function useParadym(assertState?: ParadymState['state']): ParadymState {
  const unlock = useSecureUnlock()

  useDidCommMediatorSetup({ paradym: unlock.state === 'unlocked' ? unlock.paradym : undefined })

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
    // When the state changes to unlocked, we register the credentials for the digital credentials API
    void registerCredentialsForDcApi(unlock.paradym.agent)
    return unlock
  }

  throw new Error(`Invalid unlock state: '${JSON.stringify(unlock)}'`)
}
