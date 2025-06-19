import type { Agent } from '@credo-ts/core'
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'
import type { setupAgent } from '../agent'
import { ConnectionProvider } from './ConnectionProvider'
import { CredentialExchangeProvider } from './CredentialExchangeProvider'
import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { MdocRecordProvider } from './MdocProvider'
import { ProofExchangeProvider } from './ProofExchangeProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

const AgentContext = createContext<Agent | undefined>(undefined)

export type AgentProviderProps = {
  agent: Agent
}

/**
 *
 *
 * Hook to retrieve the agent.
 *
 * It is recommended to Re-export this in your app with the correct agent type, like so
 *
 * ```typescript
 * import { initializeAgent, useAgent } from '@paradym/wallet-sdk'
 *
 * const agent = await initializeAgent(agentOptions)
 * export const useAppAgent = useAgent<typeof agent>
 * ```
 *
 */
export const useAgent = <AppAgent extends Agent = Awaited<ReturnType<typeof setupAgent>>>() => {
  const agentContext = useContext(AgentContext)

  if (!agentContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }

  return {
    agent: agentContext as AppAgent,
  }
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => {
  const DynamicProviders = useMemo(() => {
    return [
      agent.modules.proofs || agent.modules.credentials
        ? ({ children }: PropsWithChildren<{ agent: Agent }>) => (
            <ExchangeRecordDisplayMetadataProvider agent={agent}>{children}</ExchangeRecordDisplayMetadataProvider>
          )
        : undefined,
      agent.modules.credentials ? CredentialExchangeProvider : undefined,
      agent.modules.proofs ? ProofExchangeProvider : undefined,
      agent.modules.connections ? ConnectionProvider : undefined,
    ].filter((p): p is Exclude<typeof p, undefined> => p !== undefined)
  }, [agent])

  // Memoize the nested providers structure to prevent recreation on each render
  const providers = useMemo(() => {
    return DynamicProviders.reduce(
      (accChildren, Provider, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Provider key={index} agent={agent}>
          {accChildren}
        </Provider>
      ),
      <W3cCredentialRecordProvider agent={agent}>
        <SdJwtVcRecordProvider agent={agent}>
          <MdocRecordProvider agent={agent}>{children}</MdocRecordProvider>
        </SdJwtVcRecordProvider>
      </W3cCredentialRecordProvider>
    )
  }, [DynamicProviders, agent, children])

  return <AgentContext.Provider value={agent}>{providers}</AgentContext.Provider>
}
