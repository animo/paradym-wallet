import { WalletInvalidKeyError } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import { SecureUnlockProvider, secureWalletKey } from '@package/secure-store/secureUnlock'
import type { PropsWithChildren } from 'react'
import { type FullAgent, type SetupAgentOptions, setupAgent } from './agent'
import type { CredentialForDisplayId } from './display/credential'
import { ParadymWalletMustBeInitializedError } from './error'
import { useParadym } from './hooks'
import { useActivities } from './hooks/useActivities'
import { useActivityById } from './hooks/useActivityById'
import { useCredentialByCategory } from './hooks/useCredentialByCategory'
import { useCredentialById } from './hooks/useCredentialById'
import { useCredentialRecordById } from './hooks/useCredentialRecordById'
import { useCredentialRecords } from './hooks/useCredentialRecords'
import { useCredentials } from './hooks/useCredentials'
import { useDidCommConnectionActions } from './hooks/useDidCommConnectionActions'
import { useDidCommCredentialActions } from './hooks/useDidCommCredentialActions'
import { useDidCommPresentationActions } from './hooks/useDidCommPresentationActions'
import { useDidCommAgent } from './hooks/useDidcommAgent'
import { useLogger } from './hooks/useLogger'
import { useOpenId4VcAgent } from './hooks/useOpenId4VcAgent'
import { type InvitationResult, parseDidCommInvitation, parseInvitationUrl } from './invitation/parser'
import { type ResolveOutOfBandInvitationResult, resolveOutOfBandInvitation } from './invitation/resolver'
import { AgentProvider, useAgent } from './providers/AgentProvider'
import { type CredentialRecord, deleteCredential, storeCredential } from './storage/credentials'
import type { TrustMechanismConfiguration } from './trust/trustMechanism'

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

export type SetupParadymWalletSdkOptions = Omit<ParadymWalletSdkOptions, 'id' | 'key'>

export class ParadymWalletSdk {
  public trustMechanisms: TrustMechanismConfiguration[]
  public readonly agent: FullAgent

  public constructor(options: ParadymWalletSdkOptions) {
    this.agent = setupAgent(options) as FullAgent
    this.trustMechanisms = options.trustMechanisms
  }

  private assertAgentIsInitialized() {
    if (!this.agent.isInitialized) throw new ParadymWalletMustBeInitializedError()
  }

  public get walletId() {
    const walletKeyVersion = secureWalletKey.getWalletKeyVersion()

    // TODO(sdk): how do we want to deal with the `easypid` wallet id?
    return `easypid-wallet-${walletKeyVersion}`
  }

  public async reset() {
    this.logger.debug('Resetting wallet')

    await this.agent.wallet.delete()
    await this.agent.shutdown()

    const fs = new agentDependencies.FileSystem()

    // Clear cach and temp path
    if (await fs.exists(fs.cachePath)) await fs.delete(fs.cachePath)
    if (await fs.exists(fs.tempPath)) await fs.delete(fs.tempPath)

    const walletDirectory = `${fs.dataPath}/wallet/${this.walletId}`

    const walletDirectoryExists = await fs.exists(walletDirectory)
    if (walletDirectoryExists) {
      console.log('wallet directory exists, deleting')
      await fs.delete(walletDirectory)
    } else {
      console.log('wallet directory does not exist')
    }

    // I think removing triggers the biometrics somehow. We look at the salt
    // to see if the secure unlock has been setup.
    // await secureWalletKey.removeWalletKey(secureWalletKey.getWalletKeyVersion())
    await secureWalletKey.removeSalt(secureWalletKey.getWalletKeyVersion())
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
      if (e instanceof WalletInvalidKeyError) {
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
    return this.agent.config.logger
  }

  /**
   *
   * All available hooks provided by the wallet SDK
   *
   */
  public get hooks() {
    this.assertAgentIsInitialized()

    return {
      useLogger,

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
      useAgent,
      useDidCommAgent,
      useOpenId4VcAgent,
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
  }: PropsWithChildren<{ configuration: SetupParadymWalletSdkOptions }>) {
    return <SecureUnlockProvider configuration={configuration}>{children}</SecureUnlockProvider>
  }

  /**
   *
   * @todo(sdk) New name for this provider
   *
   */
  public static AppProvider({ children, recordIds }: PropsWithChildren<{ recordIds: string[] }>) {
    const { paradym } = useParadym('unlocked')

    return (
      <AgentProvider agent={paradym.agent} recordIds={recordIds}>
        {children}
      </AgentProvider>
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
      const deleteCredentials = (Array.isArray(ids) ? ids : [ids]).map((id) => deleteCredential(this.agent, id))
      await Promise.all(deleteCredentials)
      return { success: true }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : (error as string) }
    }
  }

  private async storeCredential(record: CredentialRecord): Promise<ParadymWalletSdkResult> {
    try {
      await storeCredential(this.agent, record)
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
      return { success: true, ...(await resolveOutOfBandInvitation(this.agent, parsedInvitation)) }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : `${error}` }
    }
  }
}
