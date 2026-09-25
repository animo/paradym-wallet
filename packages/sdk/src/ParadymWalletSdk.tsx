import { AskarStoreInvalidKeyError } from '@credo-ts/askar'
import { CredoError } from '@credo-ts/core'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import {
  type AgentForAgentType,
  type AgentType,
  assertAgentType,
  isDidcommAgent,
  type SetupAgentOptions,
  setupAgent,
} from './agent'
import {
  defaultWalletId,
  getTrustedX509Certificates,
  type ParadymWalletSdkAttributeLabelOptions,
  type ParadymWalletSdkDcApiDisplayOptions,
  type ParadymWalletSdkLocaleOptions,
  type ParadymWalletSdkSharedOptions,
} from './config'
import { setResolveAttributeLabel } from './config/attributeLabel'
import { setResolveDcApiDisplay } from './config/dcApiDisplay'
import { setLocale } from './config/locale'
import {
  type DcApiRegisterCredentialsOptions,
  dcApiAddCredential,
  dcApiRegisterCredentials,
  dcApiRemoveCredential,
} from './dcApi/registerCredentials'
import type { CredentialForDisplayId } from './display/credential'
import { ParadymWalletAuthenticationInvalidPinError, ParadymWalletBiometricAuthenticationError } from './error'
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
import { getIsBiometricsEnabled, secureWalletKey, setIsBiometricsEnabled } from './secure'
import { KeychainError } from './secure/error/KeychainError'
import { migrateActivities } from './storage/activityStore'
import { type CredentialRecord, deleteCredential } from './storage/credentials'
import { getWalletStoreId, setupAppGroupStore } from './storage/walletStore'
import type { TrustMechanismConfiguration } from './trust/trustMechanism'
import type { DistributedOmit } from './types'
import { reset } from './utils/reset'

export type ParadymWalletSdkResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; message: string; cause?: string }

export type ParadymWalletSdkOptions = Omit<SetupAgentOptions, 'openId4VcConfiguration'> &
  Pick<ParadymWalletSdkSharedOptions, 'openId4VcConfiguration' | 'trustMechanisms'> &
  ParadymWalletSdkLocaleOptions &
  ParadymWalletSdkAttributeLabelOptions &
  ParadymWalletSdkDcApiDisplayOptions

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
    const trustMechanisms = options.trustMechanisms ?? []

    const openId4VcConfiguration =
      options.openId4VcConfiguration === false
        ? (false as const)
        : { ...options.openId4VcConfiguration, trustedCertificates: getTrustedX509Certificates(trustMechanisms) }

    this.agent = setupAgent({ ...options, openId4VcConfiguration }) as unknown as AgentForAgentType<T>
    this.trustMechanisms = trustMechanisms

    if (options.locale) setLocale(options.locale)
    setResolveAttributeLabel(options.resolveAttributeLabel)
    setResolveDcApiDisplay(options.resolveDcApiDisplay)
  }

  /**
   *
   * Set the language credentials are rendered in.
   *
   * Everything derived from a credential reads this at the point it renders, so calling it is
   * enough — there is nothing to rebuild. A credential's display is cached per locale, and the hooks
   * that memoize displays re-render when it changes, so the screens that were showing the previous
   * language derive again rather than keeping it.
   *
   * Safe to call while rendering, which is where to call it: the components rendered after it then
   * read the new language in that same render rather than one render later.
   *
   */
  public setLocale(locale: string) {
    setLocale(locale)
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
    await reset(this)
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
    queryClient,
  }: PropsWithChildren<{ configuration: SetupParadymWalletSdkOptions; queryClient?: QueryClient }>) {
    // A default parameter would build a new client on every render, throwing away every cached
    // query and restarting the ones in flight.
    const [fallbackQueryClient] = useState(() => new QueryClient())

    return (
      <QueryClientProvider client={queryClient ?? fallbackQueryClient}>
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

    // Activities used to be one record holding the whole history; they are a record each now, and
    // the old one has to be fanned out before anything reads them. Runs at most once per unlock,
    // and returns immediately when there is nothing to move.
    useEffect(() => {
      void migrateActivities(paradym.agent).catch((error) =>
        paradym.logger.error('Failed to migrate the activity history', { error })
      )
    }, [paradym])

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
   * A field rather than a getter: a getter rebuilt this object, with new closures, on every
   * property access, so `paradym.openid4vc` was a different value every time it was read and an
   * effect that listed it as a dependency re-ran on every render. Every method below reaches
   * `this` only when called, so the field can be initialized before the constructor body assigns
   * the agent.
   *
   */
  public readonly openid4vc = {
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

  /**
   *
   * Digital credentials API functionality for presenting a proof
   *
   */
  public readonly dcApi = {
    registerCredentials: (options: Omit<DcApiRegisterCredentialsOptions, 'paradym'>) =>
      dcApiRegisterCredentials({ ...options, paradym: this }),

    addCredential: (
      options: Omit<DcApiRegisterCredentialsOptions, 'paradym'> & { credentialRecord: CredentialRecord }
    ) => dcApiAddCredential({ ...options, paradym: this }),

    removeCredential: (
      options: Omit<DcApiRegisterCredentialsOptions, 'paradym'> & { credentialId: CredentialForDisplayId }
    ) => dcApiRemoveCredential({ ...options, paradym: this }),
  }

  /**
   *
   * ISO/IEC 18013:5 mDoc/mDl proximity flow utilities
   *
   */
  public readonly proximity = {
    getSubmissionForMdocDocumentRequest: (options: Omit<GetSubmissionForMdocDocumentRequestOptions, 'mdocApi'>) =>
      getSubmissionForMdocDocumentRequest({ ...options, mdocApi: this.agent.mdoc }),
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
      const canUseBiometrics = await secureWalletKey.canUseBiometryBackedWalletKey()
      setCanUseBiometrics(canUseBiometrics)
      setCanTryUnlockingUsingBiometrics(canUseBiometrics)

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
      reset: async () => {
        reinitialize()
        await reset(paradym)
      },
      unlock: async (options) => {
        try {
          // The base id, without the wallet key version — `setupAgent` composes the store id from
          // it, and composing it here as well is what used to produce `<id>-<version>-<version>`.
          const id = configuration.id ?? defaultWalletId
          const key = walletKey

          // Must happen before the store is opened: on iOS the store lives in the shared container
          // so the identity document provider extension can open it too.
          const storePath = await setupAppGroupStore(getWalletStoreId(id))

          const pws = new ParadymWalletSdk({
            ...configuration,
            id,
            key,
            storePath,
          })
          await pws.agent.initialize()

          // Only once the store has actually opened with this key.
          //
          // Storing it beforehand meant an incorrect pin overwrote the stored wallet key with the
          // key it derived. Biometric unlock reads that same key back, so one wrong pin left
          // biometrics permanently broken — and an unopenable store is reported as a wrong pin,
          // which is exactly what it would look like from then on.
          try {
            const isBiometricsEnabled = options?.enableBiometrics ?? getIsBiometricsEnabled()
            if (canUseBiometrics && isBiometricsEnabled) {
              const walletKeyVersion = secureWalletKey.getWalletKeyVersion()
              await secureWalletKey.storeWalletKey(walletKey, walletKeyVersion)
              if (options?.enableBiometrics) {
                await secureWalletKey.getWalletKeyUsingBiometrics(walletKeyVersion)
                setIsBiometricsEnabled(true)
              }
            }
          } catch (error) {
            // The store opened, so the key was right: whatever failed here is the biometric prompt,
            // not authentication. The agent holds the store open, so close it before a retry
            // reopens it.
            await pws.shutdown()
            throw error
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
        await reset(undefined)
        reinitialize()
      },
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
      reset: async () => {
        await paradym.reset()
        reinitialize()
      },
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
        setState('locked')
        setParadym(undefined)
        setUnlockMethod(undefined)
        await paradym.shutdown()
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
