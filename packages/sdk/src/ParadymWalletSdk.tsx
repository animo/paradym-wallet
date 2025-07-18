import { useSecureUnlock } from '@package/secure-store/secureUnlock'
import type { PropsWithChildren } from 'react'
import { type FullAgent, type SetupAgentOptions, setupAgent } from './agent'
import type { CredentialForDisplayId } from './display/credential'
import { ParadymWalletMustBeInitializedError } from './error'
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

export type ParadymWalletSdkResult<T extends Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; message: string }

/**
 *
 * Options that will be used when initializing the Paradym Wallet SDK
 *
 * Make sure to instantiate the `ParadymWalletSdk` once and use the same instance within the application, via for example a `useContext`
 *
 */
export type ParadymWalletSdkOptions = SetupAgentOptions

export class ParadymWalletSdk {
  public readonly agent: FullAgent

  public constructor(options: ParadymWalletSdkOptions) {
    this.agent = setupAgent(options) as FullAgent
  }

  private assertAgentIsInitialized() {
    if (!this.agent.isInitialized) throw new ParadymWalletMustBeInitializedError()
  }

  /**
   *
   * Initialized the wallet sdk and sets everything up for usage
   *
   * @note this must be called before any usage of the agent, such as retrieving credentials
   *
   */
  public async initialize() {
    await this.agent.initialize()
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
   * All available hooks provided by the wallet SDK
   *
   */
  public get hooks() {
    this.assertAgentIsInitialized()

    return {
      useSecureUnlock,

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
   */
  public Provider({ children, recordIds }: PropsWithChildren<{ recordIds: Array<string> }>) {
    this.assertAgentIsInitialized()
    return (
      <AgentProvider agent={this.agent} recordIds={recordIds}>
        {children}
      </AgentProvider>
    )
  }

  public async receiveInvitation(
    invitationUrl: string
  ): Promise<ParadymWalletSdkResult<Omit<InvitationResult, '__internal'>>> {
    this.assertAgentIsInitialized()

    try {
      const invitationResult = await parseInvitationUrl(this.agent, invitationUrl)
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

  private async deleteCredentials(ids: CredentialForDisplayId | Array<CredentialForDisplayId>) {
    const deleteCredentials = (Array.isArray(ids) ? ids : [ids]).map((id) => deleteCredential(this.agent, id))
    await Promise.all(deleteCredentials)
  }

  private async storeCredential(record: CredentialRecord) {
    return storeCredential(this.agent, record)
  }

  public async resolveDidCommInvitation(
    invitation: string | Record<string, unknown>
  ): Promise<ParadymWalletSdkResult<ResolveOutOfBandInvitationResult>> {
    try {
      const parsedInvitation = await parseDidCommInvitation(this.agent, invitation)
      return { success: true, ...(await resolveOutOfBandInvitation(this.agent, parsedInvitation)) }
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : `${e}` }
    }
  }
}
