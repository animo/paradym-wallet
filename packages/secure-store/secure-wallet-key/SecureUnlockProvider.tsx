import { useQuery } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useContext, useState } from 'react'

import { KeychainError } from '../error/KeychainError'
import { secureWalletKey } from './secureWalletKey'

const SecureUnlockContext = createContext<SecureUnlockReturn<Record<string, unknown>>>({
  state: 'initializing',
})

export function useSecureUnlock<Context extends Record<string, unknown>>(): SecureUnlockReturn<Context> {
  const value = useContext(SecureUnlockContext)
  if (!value) {
    throw new Error('useSecureUnlock must be wrapped in a <SecureUnlockProvider />')
  }

  return value as SecureUnlockReturn<Context>
}

export function SecureUnlockProvider({ children }: PropsWithChildren) {
  const secureUnlockState = _useSecureUnlockState()

  return (
    <SecureUnlockContext.Provider value={secureUnlockState as SecureUnlockReturn<Record<string, unknown>>}>
      {children}
    </SecureUnlockContext.Provider>
  )
}

export type SecureUnlockState = 'initializing' | 'not-configured' | 'locked' | 'acquired-wallet-key' | 'unlocked'
export type SecureUnlockMethod = 'pin' | 'biometrics'

export type SecureUnlockReturnInitializing = {
  state: 'initializing'
}
export type SecureUnlockReturnNotConfigured = {
  state: 'not-configured'
  setup: (pin: string) => void
}
export type SecureUnlockReturnLocked = {
  state: 'locked'
  tryUnlockingUsingBiometrics: () => Promise<void>
  canTryUnlockingUsingBiometrics: boolean
  unlockUsingPin: (pin: string) => Promise<void>
  isUnlocking: boolean
}
export type SecureUnlockReturnWalletKeyAcquired<Context extends Record<string, unknown>> = {
  state: 'acquired-wallet-key'
  walletKey: string
  unlockMethod: SecureUnlockMethod
  setWalletKeyValid: (context: Context) => void
  setWalletKeyInvalid: () => void
}
export type SecureUnlockReturnUnlocked<Context extends Record<string, unknown>> = {
  state: 'unlocked'
  unlockMethod: SecureUnlockMethod
  context: Context
  lock: () => void
}

export type SecureUnlockReturn<Context extends Record<string, unknown>> =
  | SecureUnlockReturnInitializing
  | SecureUnlockReturnNotConfigured
  | SecureUnlockReturnLocked
  | SecureUnlockReturnWalletKeyAcquired<Context>
  | SecureUnlockReturnUnlocked<Context>

function _useSecureUnlockState<Context extends Record<string, unknown>>(): SecureUnlockReturn<Context> {
  const [state, setState] = useState<SecureUnlockState>('initializing')
  const [walletKey, setWalletKey] = useState<string>()
  const [canTryUnlockingUsingBiometrics, setCanTryUnlockingUsingBiometrics] = useState<boolean>(true)
  const [biometricsUnlockAttempts, setBiometricsUnlockAttempts] = useState(0)
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>()
  const [unlockMethod, setUnlockMethod] = useState<SecureUnlockMethod>()
  const [context, setContext] = useState<Context>()
  const [isUnlocking, setIsUnlocking] = useState(false)

  useQuery({
    queryFn: async () => {
      const salt = await secureWalletKey.getSalt(secureWalletKey.walletKeyVersion)
      // TODO: is salt the best way to test this?

      // We have two params. If e.g. unlocking using biometrics failed, we will
      // set setCanTryUnlockingUsingBiometrics to false, but `setCanUseBiometrics`
      // will still be true (so we can store it)
      const canUseBiometrics = await secureWalletKey.canUseBiometryBackedWalletKey()
      setCanUseBiometrics(canUseBiometrics)
      setCanTryUnlockingUsingBiometrics(canUseBiometrics)

      setState(salt ? 'locked' : 'not-configured')
      return salt
    },
    queryKey: ['wallet_unlock_salt'],
    enabled: state === 'initializing',
  })

  if (state === 'acquired-wallet-key') {
    if (!walletKey || !unlockMethod) {
      throw new Error('Missing walletKey or unlockMethod')
    }

    return {
      state,
      walletKey,
      unlockMethod,
      setWalletKeyInvalid: () => {
        if (unlockMethod === 'biometrics') {
          setCanTryUnlockingUsingBiometrics(false)
        }

        setState('locked')
        setWalletKey(undefined)
        setUnlockMethod(undefined)
      },
      setWalletKeyValid: (context) => {
        setContext(context)
        setState('unlocked')

        // TODO: need extra option to know whether user wants to use biometrics?
        // TODO: do we need to check whether already stored?
        if (canUseBiometrics) {
          void secureWalletKey.storeWalletKey(walletKey, secureWalletKey.walletKeyVersion)
        }
      },
    }
  }

  if (state === 'unlocked') {
    if (!walletKey || !unlockMethod || !context) {
      throw new Error('Missing walletKey, unlockMethod or context')
    }

    return {
      state,
      context,
      unlockMethod,
      lock: () => {
        setWalletKey(undefined)
        setUnlockMethod(undefined)
        setContext(undefined)
        setState('locked')
      },
    }
  }

  if (state === 'locked') {
    return {
      state,
      isUnlocking,
      canTryUnlockingUsingBiometrics,
      tryUnlockingUsingBiometrics: async () => {
        // TODO: need to somehow inform user that the unlocking went wrong
        if (!canTryUnlockingUsingBiometrics) return

        setIsUnlocking(true)
        setCanTryUnlockingUsingBiometrics(false)
        setBiometricsUnlockAttempts((attempts) => attempts + 1)
        try {
          const walletKey = await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.walletKeyVersion)
          if (walletKey) {
            setWalletKey(walletKey)
            setUnlockMethod('biometrics')
            setState('acquired-wallet-key')
          }
        } catch (error) {
          // If use cancelled we won't allow trying using biometrics again
          if (error instanceof KeychainError && error.reason === 'userCancelled') {
            setCanTryUnlockingUsingBiometrics(false)
          }
          // If other error, we will allow up to three attempts
          else if (biometricsUnlockAttempts < 3) {
            setCanTryUnlockingUsingBiometrics(true)
          }
        } finally {
          setIsUnlocking(false)
        }
      },
      unlockUsingPin: async (pin: string) => {
        setIsUnlocking(true)
        try {
          const walletKey = await secureWalletKey.getWalletKeyUsingPin(pin, secureWalletKey.walletKeyVersion)

          setWalletKey(walletKey)
          setUnlockMethod('pin')
          setState('acquired-wallet-key')
        } finally {
          setIsUnlocking(false)
        }
      },
    }
  }

  if (state === 'not-configured') {
    return {
      state,
      setup: async (pin) => {
        await secureWalletKey.createAndStoreSalt(true, secureWalletKey.walletKeyVersion)
        const walletKey = await secureWalletKey.getWalletKeyUsingPin(pin, secureWalletKey.walletKeyVersion)

        setWalletKey(walletKey)
        setUnlockMethod('pin')
        setState('acquired-wallet-key')
      },
    }
  }

  return {
    state,
  }
}
