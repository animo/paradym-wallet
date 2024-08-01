import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSalt } from './saltStore'
import { secureUnlockVersion } from './version'
import { canUseBiometryBackedWalletKey, getWalletKeyUsingBiometrics, storeWalletKey } from './walletKeyStore'
import { createSaltForPin, getWalletKeyUsingPin } from './walletKeyDerivation'

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

export type SecureUnlockState = 'initializing' | 'not-configured' | 'locked' | 'unlocked'
export type SecureUnlockMethod = 'pin' | 'biometrics'

export type SecureUnlockReturn<Context> =
  | {
      state: 'initializing'
    }
  | {
      state: 'not-configured'
      setup: (pin: string, options: { storeUsingBiometrics?: boolean }) => void
    }
  | {
      state: 'locked'
      tryUnlockingUsingBiometrics: () => Promise<void>
      canTryUnlockingUsingBiometrics: boolean
      unlockUsingPin: (pin: string) => Promise<void>
    }
  | {
      state: 'unlocked'
      walletKey: string
      unlockMethod: SecureUnlockMethod
      context: Context
      setContext: (context: Context) => void
    }

function _useSecureUnlockState<Context extends Record<string, unknown>>(): SecureUnlockReturn<Partial<Context>> {
  const [state, setState] = useState<SecureUnlockState>('initializing')
  const [walletKey, setWalletKey] = useState<string>()
  const [canTryUnlockingUsingBiometrics, setCanTryUnlockingUsingBiometrics] = useState<boolean>(true)
  const [canUseBiometrics, setCanUseBiometrics] = useState<boolean>()
  const [unlockMethod, setUnlockMethod] = useState<SecureUnlockMethod>()
  const [context, setContext] = useState<Partial<Context>>({})

  useQuery({
    queryFn: async () => {
      // TODO: is salt the best way to test this?
      const salt = await getSalt(secureUnlockVersion)

      // We have two params. If e.g. unlocking using biometrics failed, we will
      // set setCanTryUnlockingUsingBiometrics to false, but `setCanUseBiometrics`
      // will still be true (so we can store it)
      const canUseBiometrics = await canUseBiometryBackedWalletKey()
      setCanUseBiometrics(canUseBiometrics)
      setCanTryUnlockingUsingBiometrics(canUseBiometrics)

      setState(salt ? 'locked' : 'not-configured')
      return salt
    },
    queryKey: ['wallet_unlock_salt'],
    enabled: state === 'initializing',
  })

  if (state === 'unlocked') {
    if (!walletKey || !unlockMethod) {
      throw new Error('Missing walletKey or unlockMethod')
    }

    return {
      state,
      context,
      setContext,
      walletKey,
      unlockMethod,
    }
  }

  if (state === 'locked') {
    return {
      state,
      canTryUnlockingUsingBiometrics,
      tryUnlockingUsingBiometrics: async () => {
        try {
          const walletKey = await getWalletKeyUsingBiometrics(secureUnlockVersion)
          if (walletKey) {
            setWalletKey(walletKey)
            setUnlockMethod('biometrics')
            setState('unlocked')
          } else {
            // We don't have the wallet key in biometrics storage
            setCanTryUnlockingUsingBiometrics(false)
          }
        } catch (error) {
          setCanTryUnlockingUsingBiometrics(false)
          // todo: error? cancelled? Could maybe try again?
        }
      },
      unlockUsingPin: async (pin: string) => {
        // TODO: how do we verify the key is correct?
        const walletKey = await getWalletKeyUsingPin(pin, secureUnlockVersion)

        // TODO: need extra option to know whether user wants to use biometrics?
        if (canUseBiometrics) {
          await storeWalletKey(walletKey, secureUnlockVersion)
        }
        setWalletKey(walletKey)
        setUnlockMethod('pin')
        setState('unlocked')
      },
    }
  }

  if (state === 'not-configured') {
    return {
      state,
      setup: async (pin, { storeUsingBiometrics = true }) => {
        await createSaltForPin(true, secureUnlockVersion)
        const walletKey = await getWalletKeyUsingPin(pin, secureUnlockVersion)

        if (canUseBiometrics && storeUsingBiometrics) {
          await storeWalletKey(walletKey, secureUnlockVersion).catch((error) => {
            // TODO: handle
            // TODO: set state param?
          })
        }

        setWalletKey(walletKey)
        setUnlockMethod('pin')
        setState('unlocked')
      },
    }
  }

  return {
    state,
  }
}
