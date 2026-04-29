import { AskarStoreInvalidKeyError } from '@credo-ts/askar'
import { CredoError } from '@credo-ts/core'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type PropsWithChildren, useContext, useState } from 'react'
import {
  type AgentForAgentType,
  type AgentType,
  assertAgentType,
  isDidcommAgent,
  type SetupAgentOptions,
  setupAgent,
} from './agent'
import { type DcApiRegisterCredentialsOptions, dcApiRegisterCredentials } from './dcApi/registerCredentials'
import { type DcApiResolveRequestOptions, dcApiResolveRequest } from './dcApi/resolveRequest'
import { dcApisendErrorResponse } from './dcApi/sendErrorResponse'
import { type DcApiSendResponseOptions, dcApiSendResponse } from './dcApi/sendResponse'
import type { CredentialForDisplayId } from './display/credential'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
} from './error'
import { useParadym } from './hooks'
import { parseDidCommInvitation } from './invitation/parser'
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
import {
  type GetSubmissionForMdocDocumentRequestOptions,
  getSubmissionForMdocDocumentRequest,
} from './proximity/getSubmissionForMdocDocumentRequest'
import { getBiometricUnlockStateQueryKey, secureWalletKey } from './secure'
import { KeychainError } from './secure/error/KeychainError'
import { deleteCredential } from './storage/credentials'
import type { TrustMechanismConfiguration } from './trust/trustMechanism'
import type { DistributedOmit } from './types'
import { reset } from './utils/reset'

export type ParadymWalletSdkResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; message: string; cause?: string }

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
  trustMechanisms?: TrustMechanismConfiguration[]
}

export type SetupParadymWalletSdkOptions = Omit<ParadymWalletSdkOptions, 'key'>

export function assertParadymSdkType<T extends AgentType>(
  // biome-ignore lint/suspicious/noExplicitAny: no explanation
  sdk: ParadymWalletSdk<any>,
  agentType: T
): asserts sdk is ParadymWalletSdk<T> {
  assertAgentType(sdk.agent, agentType)
}

export class ParadymWalletSdk<T extends AgentType = AgentType> {
  public trustMechanisms: TrustMechanismConfiguration[]
  public readonly agent: AgentForAgentType<T>

  public constructor(options: ParadymWalletSdkOptions) {
    this.agent = setupAgent(options) as unknown as AgentForAgentType<T>
    this.trustMechanisms = options.trustMechanisms ?? []
  }

  public get isDidCommEnabled() {
    return isDidcommAgent(this.agent)
  }

  public get isOpenId4VcEnabled() {
    return !!this.agent.openid4vc
  }

  public get walletId() {
    return this.agent.modules.askar.config.store.id
  }

  public async reset() {
    reset(this)
  }

  /**
   *
   * Initialized the wallet sdk and sets everything up for usage
   *
   */
  public async initialize(): Promise<void> {
    await this.agent.initialize()
  }

  /**
   *
   * Shutdown the agent and closes the wallet
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
   * Provider for the WalletSdk
   *
   * This provider is required for the wallet sdk to work correctly. It adds a query client and ways to unlock the wallet
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
   * Provider for the paradym instance
   *
   * Make sure to add this to a stage in the application where the state of paradym is `unlocked`
   *
   * This provider gives access to all the records using the provided hooks
   *
   */
  public static AppProvider({ children, recordIds }: PropsWithChildren<{ recordIds: string[] }>) {
    const { paradym } = useParadym('unlocked')

    return (
      <RecordProvider agent={paradym.agent} recordIds={recordIds}>
        {children}
      </RecordProvider>
    )
  }

  /**
   *
   * DIDComm utility method to resolve a DIDComm invitation to be used later to start a connection, and optionally also present a proof or receive a credential
   *
   */
  public async resolveDidCommInvitation(
    invitation: string | Record<string, unknown>
  ): Promise<ParadymWalletSdkResult<ResolveOutOfBandInvitationResult>> {
    try {
      assertParadymSdkType(this, 'didcomm')
      const parsedInvitation = await parseDidCommInvitation(this, invitation)
      return {
        success: true,
        ...(await resolveOutOfBandInvitation(this, parsedInvitation)),
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : `${error}` }
    }
  }

  public async deleteCredentials(
    options: DcApiRegisterCredentialsOptions & { credentialIds: CredentialForDisplayId | Array<CredentialForDisplayId> }
  ): Promise<ParadymWalletSdkResult> {
    try {
      const deleteCredentials = (
        Array.isArray(options.credentialIds) ? options.credentialIds : [options.credentialIds]
      ).map((id) => deleteCredential({ ...options, credentialId: id }))
      await Promise.all(deleteCredentials)
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : (error as string) }
    }
  }

  /**
   *
   * Openid4vc functionality, for receiving a credential and presenting a proof
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

  /**
   *
   * Digital credentials API functionality for presentating a proof
   *
   */
  public get dcApi() {
    return {
      registerCredentials: (options: Omit<DcApiRegisterCredentialsOptions, 'paradym'>) =>
        dcApiRegisterCredentials({ ...options, paradym: this }),
      resolveRequest: (options: Omit<DcApiResolveRequestOptions, 'paradym'>) =>
        dcApiResolveRequest({ ...options, paradym: this }),
      sendResponse: (options: Omit<DcApiSendResponseOptions, 'paradym'>) =>
        dcApiSendResponse({ ...options, paradym: this }),
      sendErrorResponse: dcApisendErrorResponse,
    }
  }

  /**
   *
   * ISO/IEC 18013:5 mDoc/mDl proximity flow utilites
   *
   */
  public get proximity() {
    return {
      getSubmissionForMdocDocumentRequest: (options: Omit<GetSubmissionForMdocDocumentRequestOptions, 'paradym'>) =>
        getSubmissionForMdocDocumentRequest({ ...options, paradym: this }),
    }
  }
}

function useSecureUnlockState(configuration: SetupParadymWalletSdkOptions): SecureUnlockReturn {
  const queryClient = useQueryClient()
  const [state, setState] = useState<SecureUnlockState>('initializing')
  const [canTryUnlockingUsingBiometrics, setCanTryUnlockingUsingBiometrics] = useState<boolean>(true)
  const [biometricsUnlockAttempts, setBiometricsUnlockAttempts] = useState(0)
  const [unlockMethod, setUnlockMethod] = useState<UnlockMethod>()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [paradym, setParadym] = useState<ParadymWalletSdk>()
  const [walletKey, setWalletKey] = useState<string>()

  const syncBiometricUnlockState = async () => {
    const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
    const biometricUnlockState = await secureWalletKey.getBiometricUnlockState(walletKeyVersion)

    queryClient.setQueryData(getBiometricUnlockStateQueryKey(walletKeyVersion), biometricUnlockState)
    setCanTryUnlockingUsingBiometrics(biometricUnlockState.canUnlockNow)

    return biometricUnlockState
  }

  const enableBiometricUnlock = async (walletKeyToStore: string) => {
    const walletKeyVersion = secureWalletKey.getWalletKeyVersion()

    try {
      await secureWalletKey.storeWalletKey(walletKeyToStore, walletKeyVersion)
      const storedWalletKey = await secureWalletKey.getWalletKeyUsingBiometrics(walletKeyVersion)

      if (!storedWalletKey || storedWalletKey !== walletKeyToStore) {
        throw new Error('Stored wallet key could not be verified after enabling biometric unlock')
      }
    } catch (error) {
      await secureWalletKey.removeWalletKey(walletKeyVersion).catch(() => undefined)
      throw error
    } finally {
      await syncBiometricUnlockState()
    }
  }

  const disableBiometricUnlock = async () => {
    const walletKeyVersion = secureWalletKey.getWalletKeyVersion()

    await secureWalletKey.removeWalletKey(walletKeyVersion)
    await syncBiometricUnlockState()
  }

  useQuery({
    queryFn: async () => {
      const salt = await secureWalletKey.getSalt(secureWalletKey.getWalletKeyVersion())
      await syncBiometricUnlockState()

      setState(salt ? 'locked' : 'not-configured')
      return salt
    },
    queryKey: ['wallet_unlock_salt'],
    enabled: state === 'initializing',
  })

  const reinitialize = () => {
    setState('initializing')
    setWalletKey(undefined)
    setCanTryUnlockingUsingBiometrics(true)
    setBiometricsUnlockAttempts(0)
    setUnlockMethod(undefined)
    setIsUnlocking(false)
    setParadym(undefined)
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
      reset,
      unlock: async (_options) => {
        try {
          const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
          const id = configuration.id ? `${configuration.id}-${walletKeyVersion}` : `paradym-wallet-${walletKeyVersion}`
          const key = walletKey

          const pws = new ParadymWalletSdk({
            ...configuration,
            id,
            key,
          })
          await pws.agent.initialize()
          if (_options?.enableBiometrics) {
            await enableBiometricUnlock(walletKey)
          }
          setState('unlocked')
          setParadym(pws)
          return pws
        } catch (error) {
          if (error instanceof CredoError && error.cause instanceof AskarStoreInvalidKeyError) {
            setState('locked')
            setWalletKey(undefined)
            setUnlockMethod(undefined)

            if (unlockMethod === 'biometrics') {
              await disableBiometricUnlock()
              setCanTryUnlockingUsingBiometrics(false)
              throw new ParadymWalletBiometricAuthenticationError()
            }
            throw new ParadymWalletAuthenticationInvalidPinError()
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
      reset: async () => {
        await reset()
        reinitialize()
      },
      tryUnlockingUsingBiometrics: async () => {
        // TODO: need to somehow inform user that the unlocking went wrong
        const biometricUnlockState = await syncBiometricUnlockState()
        const nextBiometricUnlockAttempts = biometricsUnlockAttempts + 1

        if (!biometricUnlockState.canUnlockNow) return

        setIsUnlocking(true)
        setBiometricsUnlockAttempts(nextBiometricUnlockAttempts)
        try {
          const walletKey = await secureWalletKey.getWalletKeyUsingBiometrics(secureWalletKey.getWalletKeyVersion())
          if (walletKey) {
            setWalletKey(walletKey)
            setUnlockMethod('biometrics')
            setState('acquired-wallet-key')
          } else {
            await disableBiometricUnlock()
          }
        } catch (error) {
          // If use cancelled we won't allow trying using biometrics again
          if (
            error instanceof ParadymWalletBiometricAuthenticationCancelledError ||
            (error instanceof KeychainError && error.reason === 'userCancelled')
          ) {
            setCanTryUnlockingUsingBiometrics(false)
          }
          // If biometrics are no longer configured for device/app, remove stale key and sync derived state
          else if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
            await disableBiometricUnlock()
          }
          // If another parsed biometric error happened, re-sync derived state
          else if (error instanceof ParadymWalletBiometricAuthenticationError) {
            await syncBiometricUnlockState()
          }
          // If other error, we will allow up to three attempts
          else if (nextBiometricUnlockAttempts >= 3) {
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
      reset: async () => {
        await paradym.reset()
        reinitialize()
      },
      enableBiometricUnlock: async () => enableBiometricUnlock(walletKey),
      disableBiometricUnlock,
      reinitialize,
      lock: async () => {
        await paradym.shutdown()
        setParadym(undefined)
        setWalletKey(undefined)
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
  unlock: (options?: UnlockOptions) => Promise<ParadymWalletSdk>
  reset: () => Promise<void>
  reinitialize: () => void
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

export type SecureUnlockReturnUnlocked<T extends AgentType = AgentType> = {
  state: 'unlocked'
  paradym: ParadymWalletSdk<T>
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
