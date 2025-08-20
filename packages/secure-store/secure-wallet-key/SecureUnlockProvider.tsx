import { WalletInvalidKeyError } from '@credo-ts/core'
import { ParadymWalletSdk, type SetupParadymWalletSdkOptions } from '@paradym/wallet-sdk/ParadymWalletSdk'
import { useQuery } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'
import { KeychainError } from '../error/KeychainError'
import { secureWalletKey } from './secureWalletKey'

type UnlockOptions = {
  /**
   *
   * When setting up the agent for the first time, the app might want to prompt the biometrics to make sure
   * the user has access
   *
   * This should be set on the unlock call during the onboarding of the user, but not during authentication afterwards
   *
   */
  enableBiometrics: boolean
}

export type SecureUnlockState = 'initializing' | 'not-configured' | 'acquired-wallet-key' | 'locked' | 'unlocked'

export type UnlockMethod = 'pin' | 'biometrics'

export type SecureUnlockReturnInitializing = {
  state: 'initializing'
}

export type SecureUnlockReturnNotConfigured = {
  state: 'not-configured'
  setPin: (pin: string) => Promise<void>
  reinitialize: () => void
}

export type SecureUnlockReturnWalletKeyAcquired = {
  state: 'acquired-wallet-key'
  unlockMethod: UnlockMethod
  unlock: (options?: UnlockOptions) => Promise<void>
  reinitialize: () => void
}

export type SecureUnlockReturnLocked = {
  state: 'locked'
  canTryUnlockingUsingBiometrics: boolean
  isUnlocking: boolean
  tryUnlockingUsingBiometrics: () => Promise<void>
  unlockUsingPin: (pin: string) => Promise<void>
  reinitialize: () => void
}

export type SecureUnlockReturnUnlocked = {
  state: 'unlocked'
  paradym: ParadymWalletSdk
  unlockMethod: UnlockMethod
  lock: () => Promise<void>
  reset: () => Promise<void>
  reinitialize: () => void
}

export type SecureUnlockReturn =
  | SecureUnlockReturnInitializing
  | SecureUnlockReturnNotConfigured
  | SecureUnlockReturnWalletKeyAcquired
  | SecureUnlockReturnLocked
  | SecureUnlockReturnUnlocked

const SecureUnlockContext = createContext<SecureUnlockReturn>({
  state: 'initializing',
})

export function useSecureUnlock(): SecureUnlockReturn {
  const value = useContext(SecureUnlockContext)
  if (!value) {
    throw new Error('useSecureUnlock must be wrapped in a <SecureUnlockProvider />')
  }

  return value
}

export function SecureUnlockProvider({
  children,
  configuration,
}: PropsWithChildren<{ configuration: SetupParadymWalletSdkOptions }>) {
  const secureUnlockState = _useSecureUnlockState(configuration)

  return <SecureUnlockContext.Provider value={secureUnlockState}>{children}</SecureUnlockContext.Provider>
}

function _useSecureUnlockState(configuration: SetupParadymWalletSdkOptions): SecureUnlockReturn {
  const [state, setState] = useState<SecureUnlockState>('initializing')
  const [canTryUnlockingUsingBiometrics, setCanTryUnlockingUsingBiometrics] = useState<boolean>(true)
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>()
  const [biometricsUnlockAttempts, setBiometricsUnlockAttempts] = useState(0)
  const [unlockMethod, setUnlockMethod] = useState<UnlockMethod>()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [paradym, setParadym] = useState<ParadymWalletSdk>()
  const [walletKey, setWalletKey] = useState<string>()

  useQuery({
    queryFn: async () => {
      const salt = await secureWalletKey.getSalt(secureWalletKey.getWalletKeyVersion())
      // TODO: is salt the best way to test this?

      // We have two params. If e.g. unlocking using biometrics failed, we will
      // set setCanTryUnlockingUsingBiometrics to false, but `setCanUseBiometrics`
      // will still be true (so we can store it)
      const cub = await secureWalletKey.canUseBiometryBackedWalletKey()
      setCanUseBiometrics(cub)
      setCanTryUnlockingUsingBiometrics(cub)

      setState(salt ? 'locked' : 'not-configured')
      return salt
    },
    queryKey: ['wallet_unlock_salt'],
    enabled: state === 'initializing',
  })

  useEffect(() => {
    console.log('secure unlock state: ', state)
  }, [state])

  const reinitialize = () => {
    setState('initializing')
    setCanTryUnlockingUsingBiometrics(true)
    setBiometricsUnlockAttempts(0)
    setUnlockMethod(undefined)
    setCanUseBiometrics(undefined)
    setIsUnlocking(false)
  }

  if (state === 'not-configured') {
    return {
      state,
      reinitialize,
      setPin: async (pin) => {
        await secureWalletKey.createAndStoreSalt(true, secureWalletKey.getWalletKeyVersion())
        const walletKey = await secureWalletKey.getWalletKeyUsingPin(pin, secureWalletKey.getWalletKeyVersion())

        setWalletKey(walletKey)
        setUnlockMethod('pin')
        setState('acquired-wallet-key')
      },
    }
  }

  if (state === 'acquired-wallet-key') {
    if (!walletKey || !unlockMethod) {
      throw new Error('Missing walletKey or unlockMethod')
    }

    return {
      state,
      unlockMethod,
      reinitialize,
      unlock: async (options) => {
        try {
          const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
          // TODO: need extra option to know whether user wants to use biometrics?
          // TODO: do we need to check whether already stored?
          if (canUseBiometrics && options?.enableBiometrics) {
            await secureWalletKey.storeWalletKey(walletKey, walletKeyVersion)
            await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
          }

          const id = `easypid-wallet-${walletKeyVersion}`
          const key = walletKey

          // TODO: let the user provide an id? Or should we create one by default
          const pws = new ParadymWalletSdk({
            ...configuration,
            id,
            key,
          })
          pws.initialize().then((result) => {
            if (result.success) {
              setState('unlocked')
              setParadym(pws)
            } else {
              console.error(result.message)
              throw Error(result.message)
            }
          })
        } catch (error) {
          if (error instanceof WalletInvalidKeyError) {
            if (unlockMethod === 'biometrics') {
              setCanTryUnlockingUsingBiometrics(false)
            }

            setState('locked')
            setWalletKey(undefined)
            setUnlockMethod(undefined)
          }
          throw error
        }
      },
    }
  }

  if (state === 'locked') {
    return {
      state,
      isUnlocking,
      canTryUnlockingUsingBiometrics,
      reinitialize,
      tryUnlockingUsingBiometrics: async () => {
        // TODO: need to somehow inform user that the unlocking went wrong
        if (!canTryUnlockingUsingBiometrics) return

        setIsUnlocking(true)
        setBiometricsUnlockAttempts((attempts) => attempts + 1)
        try {
          const walletKey = await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
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
          else if (biometricsUnlockAttempts > 3) {
            setCanTryUnlockingUsingBiometrics(false)
          }
        } finally {
          setIsUnlocking(false)
        }
      },
      unlockUsingPin: async (pin: string) => {
        setIsUnlocking(true)
        try {
          const walletKey = await secureWalletKey.getWalletKeyUsingPin(pin, secureWalletKey.getWalletKeyVersion())

          setWalletKey(walletKey)
          setUnlockMethod('pin')
          setState('acquired-wallet-key')
        } finally {
          setIsUnlocking(false)
        }
      },
    }
  }

  if (state === 'unlocked') {
    if (!unlockMethod || !paradym) {
      throw new Error(`unlockMethod (${!!unlockMethod}) or paradym (${!!paradym})`)
    }

    return {
      state,
      unlockMethod,
      paradym,
      reset: paradym.reset,
      reinitialize,
      lock: async () => {
        await paradym.shutdown()
        setParadym(undefined)
        setState('locked')
        setUnlockMethod(undefined)
      },
    }
  }

  return {
    state,
  }
}
