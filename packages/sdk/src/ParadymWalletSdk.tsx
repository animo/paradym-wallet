import type { PropsWithChildren } from 'react'
import { type FullAgent, type SetupAgentOptions, setupAgent } from './agent'
import { ParadymWalletMustBeInitializedError } from './error'
import { useCredentialById } from './hooks/useCredentialById'
import { useCredentialRecordById } from './hooks/useCredentialRecordById'
import { useCredentialRecords } from './hooks/useCredentialRecords'
import { useCredentials } from './hooks/useCredentials'
import { useDidCommAgent } from './hooks/useDidcommAgent'
import { useOpenId4VcAgent } from './hooks/useOpenId4VcAgent'
import { AgentProvider, useAgent } from './providers/AgentProvider'

/**
 *
 * Options that will be used when initializing the Paradym Wallet SDK
 *
 * Make sure to instantiate the `ParadymWalletSdk` once and use the same instance within the application, via for example a `useContext`
 *
 */
export type ParadymWalletSdkOptions = SetupAgentOptions

export class ParadymWalletSdk {
  private agent: FullAgent

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
   * All available hooks provided by the wallet SDK
   *
   * @todo Ideally, we only want to return the hooks based on whether it is a didcomm/openid4vc agent
   *       This can be done quite simple, but in order to provide correct types, it get very complex
   *
   */
  public get hooks() {
    this.assertAgentIsInitialized()

    return {
      useCredentials,
      useCredentialById,
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
  public Provider({ children }: PropsWithChildren) {
    this.assertAgentIsInitialized()
    return <AgentProvider agent={this.agent}>{children}</AgentProvider>
  }

  public receiveInvitation() {
    this.assertAgentIsInitialized()
  }
}
