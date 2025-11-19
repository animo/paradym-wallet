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
import { W3cV2CredentialRecordProvider } from './W3cV2CredentialsProvider'
import { WalletJsonStoreProvider } from './WalletJsonStoreProvider'

const AgentContext = createContext<Agent | undefined>(undefined)

export type AgentProviderProps = {
  agent: Agent

  // TODO: can we remove this? Why not just ignore specific record ids and use em all?
  recordIds: Array<string>
}

/**
 *
 *
 * Hook to retrieve the agent.
 *
 */
export const useAgent = <ProvidedAgent extends Agent = Awaited<ReturnType<typeof setupAgent>>>() => {
  const agentContext = useContext(AgentContext)

  if (!agentContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }

  return {
    agent: agentContext as ProvidedAgent,
  }
}

export const AgentProvider = ({ agent, recordIds, children }: PropsWithChildren<AgentProviderProps>) => {
  const DynamicProviders = useMemo(() => {
    return agent.didcomm
      ? [ExchangeRecordDisplayMetadataProvider, CredentialExchangeProvider, ProofExchangeProvider, ConnectionProvider]
      : []
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
      <WalletJsonStoreProvider agent={agent} recordIds={recordIds}>
        <W3cV2CredentialRecordProvider agent={agent}>
          <W3cCredentialRecordProvider agent={agent}>
            <SdJwtVcRecordProvider agent={agent}>
              <MdocRecordProvider agent={agent}>{children}</MdocRecordProvider>
            </SdJwtVcRecordProvider>
          </W3cCredentialRecordProvider>
        </W3cV2CredentialRecordProvider>
      </WalletJsonStoreProvider>
    )
  }, [DynamicProviders, agent, children, recordIds])

  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>
}
