import { AskarModule, AskarStoreInvalidKeyError } from '@credo-ts/askar'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { createContext, type PropsWithChildren, useContext, useState } from 'react'
import { type DidCommAgent, type FullAgent, type SetupAgentOptions, setupAgent } from './agent'
import { dcApiRegisterCredentials } from './dcApi/registerCredentials'
import { type DcApiResolveRequestOptions, dcApiResolveRequest } from './dcApi/resolveRequest'
import { dcApisendErrorResponse } from './dcApi/sendErrorResponse'
import { type DcApiSendResponseOptions, dcApiSendResponse } from './dcApi/sendResponse'
import type { CredentialForDisplayId } from './display/credential'
import { ParadymWalletMustBeInitializedError } from './error'
import { useActivities, useActivityById, useParadym } from './hooks'
import { useCredentialByCategory } from './hooks/useCredentialByCategory'
import { useCredentialById } from './hooks/useCredentialById'
import { useCredentialRecordById } from './hooks/useCredentialRecordById'
import { useCredentialRecords } from './hooks/useCredentialRecords'
import { useCredentials } from './hooks/useCredentials'
import { useDidCommConnectionActions } from './hooks/useDidCommConnectionActions'
import { useDidCommCredentialActions } from './hooks/useDidCommCredentialActions'
import { useDidCommPresentationActions } from './hooks/useDidCommPresentationActions'
import { useRefreshedDeferredCredentials } from './hooks/useRefreshedDeferredCredentials'
import { type InvitationResult, parseDidCommInvitation, parseInvitationUrl } from './invitation/parser'
import {
  type ResolveCredentialOfferOptions,
  type ResolveOutOfBandInvitationResult,
  resolveCredentialOffer,
  resolveOutOfBandInvitation,
} from './invitation/resolver'
import type { ParadymWalletSdkLogger } from './logging'
import { type AcquireCredentialsOptions, acquireCredentials } from './openid4vc/func/acquireCredentials'
import {
  type CompleteCredentialRetrievalOptions,
  completeCredentialRetrieval,
} from './openid4vc/func/completeCredentialRetrieval'
import {
  type DeclineCredentialRequestOptions,
  declineCredentialRequest,
} from './openid4vc/func/declineCredentialRequest'
import {
  type ReceiveDeferredCredentialFromOpenId4VciOfferOptions,
  receiveDeferredCredentialFromOpenId4VciOffer,
} from './openid4vc/func/receiveDeferredCredentialFromOpenId4VciOffer'
import {
  type ResolveCredentialRequestOptions,
  resolveCredentialRequest,
} from './openid4vc/func/resolveCredentialRequest'
import { type ShareCredentialsOptions, shareCredentials } from './openid4vc/func/shareCredentials'
import { RecordProvider } from './providers/AgentProvider'
import { secureWalletKey, setIsBiometricsEnabled } from './secure'
import { KeychainError } from './secure/error/KeychainError'
import { type CredentialRecord, deleteCredential, storeCredential } from './storage/credentials'
import type { TrustMechanismConfiguration } from './trust/trustMechanism'
import type { DistributedOmit } from './types'
import { reset } from './utils/reset'

export type ParadymWalletSdkResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; message: string }

export type ParadymWalletSdkOptions = SetupAgentOptions & {
  /**
   *
   * Trust mechanisms supported by the wallet
   *
   * The order matters. The first index will be tried first, until the last
   *
   * When one is found that works, it will be used
   *
   */
  // TODO(sdk): this will get more complex, as eudi_rp_auth needs more configuration
  trustMechanisms: TrustMechanismConfiguration[]
}

export type SetupParadymWalletSdkOptions = Omit<ParadymWalletSdkOptions, 'key'>

export class ParadymWalletSdk {
  public trustMechanisms: TrustMechanismConfiguration[]
  // TODO(sdk): fix this typing
  public readonly agent: FullAgent

  public constructor(options: ParadymWalletSdkOptions) {
    this.agent = setupAgent(options) as unknown as FullAgent
    this.trustMechanisms = options.trustMechanisms
  }

  public get isDidCommEnabled() {
    return !!this.agent.didcomm
  }

  public get isOpenId4VcEnabled() {
    return !!this.agent.openid4vc
  }

  private assertAgentIsInitialized() {
    if (!this.agent.isInitialized) throw new ParadymWalletMustBeInitializedError()
  }

  public get walletId() {
    const askar = this.agent.context.resolve(AskarModule)
    return askar.config.store.id
  }

  public async reset() {
    reset(this)
  }

  /**
   *
   * Initialized the wallet sdk and sets everything up for usage
   *
   */
  public async initialize(): Promise<ParadymWalletSdkResult> {
    try {
      await this.agent.initialize()
      return { success: true }
    } catch (e) {
      if (e instanceof AskarStoreInvalidKeyError) {
        return { success: false, message: 'Invalid key' }
      }
      return { success: false, message: (e as Error).message }
    }
  }

  /**
   *
   * Shutsdown the agent and closes the wallet
   *
   */
  public async shutdown() {
    await this.agent.shutdown()
  }

  /**
   *
   * Paradym logger
   *
   * defaults to a console logger
   *
   */
  public get logger() {
    return this.agent.config.logger as ParadymWalletSdkLogger
  }

  /**
   *
   * All available hooks provided by the wallet SDK
   *
   */
  public get hooks() {
    this.assertAgentIsInitialized()

    return {
      useCredentials,
      useCredentialById,
      useCredentialByCategory,

      useActivities,
      useActivityById,

      // TODO: these are quite different than the openid4vc way
      //       do we want to keep it like this or make them more consistent?
      useDidCommConnectionActions,
      useDidCommCredentialActions,
      useDidCommPresentationActions,

      useRefreshedDeferredCredentials,
    }
  }

  /**
   *
   * Unstable hooks that can be used for more low-level functionality
   *
   * It is generally recommended to see if the desired output can be reached with `ParadymWalletSdk.hooks` first
   *
   */
  public get internalHooks() {
    this.assertAgentIsInitialized()

    return {
      useCredentialRecords,
      useCredentialRecordById,
    }
  }

  /**
   *
   * Provider for the WalletSdk
   *
   * Wrap your application in this, if you want to leverage the provided `this.hooks`
   *
   * @todo(sdk) New name for this provider
   *
   */
  public static UnlockProvider({
    children,
    configuration,
    queryClient = new QueryClient(),
  }: PropsWithChildren<{ configuration: SetupParadymWalletSdkOptions; queryClient?: QueryClient }>) {
    return (
      <QueryClientProvider client={queryClient}>
        <SecureUnlockProvider configuration={configuration}>{children}</SecureUnlockProvider>
      </QueryClientProvider>
    )
  }

  /**
   *
   * @todo(sdk) New name for this provider
   *
   */
  public static AppProvider({ children, recordIds }: PropsWithChildren<{ recordIds: string[] }>) {
    const { paradym } = useParadym('unlocked')

    return (
      <RecordProvider agent={paradym.agent as unknown as DidCommAgent} recordIds={recordIds}>
        {children}
      </RecordProvider>
    )
  }

  public async receiveInvitation(
    invitationUrl: string
  ): Promise<ParadymWalletSdkResult<Omit<InvitationResult, '__internal'>>> {
    this.assertAgentIsInitialized()

    try {
      const invitationResult = await parseInvitationUrl(this, invitationUrl)
      return { success: true, ...invitationResult }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : (error as string),
      }
    }
  }

  /**
   *
   * @todo how do we want to deal with didcomm proofs and credentials?
   *
   */
  public get credentials() {
    return {
      delete: this.deleteCredentials,
      store: this.storeCredential,
    }
  }

  private async deleteCredentials(
    ids: CredentialForDisplayId | Array<CredentialForDisplayId>
  ): Promise<ParadymWalletSdkResult> {
    try {
      const deleteCredentials = (Array.isArray(ids) ? ids : [ids]).map((id) => deleteCredential(this, id))
      await Promise.all(deleteCredentials)
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : (error as string) }
    }
  }

  private async storeCredential(record: CredentialRecord): Promise<ParadymWalletSdkResult> {
    try {
      await storeCredential(this, record)
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : (error as string) }
    }
  }

  public async resolveDidCommInvitation(
    invitation: string | Record<string, unknown>
  ): Promise<ParadymWalletSdkResult<ResolveOutOfBandInvitationResult>> {
    try {
      const parsedInvitation = await parseDidCommInvitation(this, invitation)
      return {
        success: true,
        ...(await resolveOutOfBandInvitation(this.agent as unknown as DidCommAgent, parsedInvitation)),
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : `${error}` }
    }
  }

  /**
   *
   * @todo should we scope this in proof/issuance?
   *
   */
  public get openid4vc() {
    return {
      resolveCredentialOffer: (options: Omit<ResolveCredentialOfferOptions, 'paradym'>) =>
        resolveCredentialOffer({ ...options, paradym: this }),

      acquireCredentials: (options: DistributedOmit<AcquireCredentialsOptions, 'paradym'>) =>
        acquireCredentials({ ...options, paradym: this }),

      completeCredentialRetrieval: (options: Omit<CompleteCredentialRetrievalOptions, 'paradym'>) =>
        completeCredentialRetrieval({ ...options, paradym: this }),

      receiveDeferredCredential: (options: Omit<ReceiveDeferredCredentialFromOpenId4VciOfferOptions, 'paradym'>) =>
        receiveDeferredCredentialFromOpenId4VciOffer({ ...options, paradym: this }),

      resolveCredentialRequest: (options: Omit<ResolveCredentialRequestOptions, 'paradym'>) =>
        resolveCredentialRequest({ ...options, paradym: this }),

      declineCredentialRequest: (options: Omit<DeclineCredentialRequestOptions, 'paradym'>) =>
        declineCredentialRequest({ ...options, paradym: this }),

      shareCredentials: (options: Omit<ShareCredentialsOptions, 'paradym'>) =>
        shareCredentials({ ...options, paradym: this }),
    }
  }

  public get dcApi() {
    return {
      registerCredentials: () => dcApiRegisterCredentials(this),
      resolveRequest: (options: Omit<DcApiResolveRequestOptions, 'paradym'>) =>
        dcApiResolveRequest({ ...options, paradym: this }),
      sendResponse: (options: Omit<DcApiSendResponseOptions, 'paradym'>) =>
        dcApiSendResponse({ ...options, paradym: this }),
      sendErrorResponse: dcApisendErrorResponse,
    }
  }
}

function useSecureUnlockState(configuration: SetupParadymWalletSdkOptions): SecureUnlockReturn {
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
      enableBiometricUnlock: async () => {
        await secureWalletKey.storeWalletKey(walletKey, secureWalletKey.getWalletKeyVersion())
        await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
        setIsBiometricsEnabled(true)
      },
      disableBiometricUnlock: async () => {
        await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
        setIsBiometricsEnabled(false)
      },
      unlock: async (options) => {
        try {
          const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
          // TODO: need extra option to know whether user wants to use biometrics?
          // TODO: do we need to check whether already stored?
          if (canUseBiometrics && options?.enableBiometrics) {
            await secureWalletKey.storeWalletKey(walletKey, walletKeyVersion)
            await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
          }

          const id = `paradym-wallet-${walletKeyVersion}`
          const key = walletKey

          // TODO(sdk): let the user provide an id? Or should we create one by default
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
              throw Error(result.message)
            }
          })
        } catch (error) {
          if (error instanceof AskarStoreInvalidKeyError) {
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
      reset,
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
    if (!unlockMethod || !paradym || !walletKey) {
      throw new Error(`unlockMethod (${!!unlockMethod}), paradym (${!!paradym}) or wallet key (${!!walletKey})`)
    }

    return {
      state,
      unlockMethod,
      paradym,
      reset: paradym.reset,
      enableBiometricUnlock: async () => {
        await secureWalletKey.storeWalletKey(walletKey, secureWalletKey.getWalletKeyVersion())
        await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
        setIsBiometricsEnabled(true)
      },
      disableBiometricUnlock: async () => {
        await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
        setIsBiometricsEnabled(false)
      },
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

  // TODO(sdk): can this just be removed and only be added when unlocked?
  enableBiometricUnlock: () => Promise<void>
  disableBiometricUnlock: () => Promise<void>
}

export type SecureUnlockReturnLocked = {
  state: 'locked'
  canTryUnlockingUsingBiometrics: boolean
  isUnlocking: boolean
  reset: () => Promise<void>
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

  enableBiometricUnlock: () => Promise<void>
  disableBiometricUnlock: () => Promise<void>
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
  const secureUnlockState = useSecureUnlockState(configuration)

  return <SecureUnlockContext.Provider value={secureUnlockState}>{children}</SecureUnlockContext.Provider>
}
