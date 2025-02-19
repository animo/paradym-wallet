import type { Agent } from '@credo-ts/core'
import { type PropsWithChildren, createContext, useContext } from 'react'

import type { EitherAgent, ParadymAppAgent } from '../agent'
import { ConnectionProvider } from './ConnectionProvider'
import { CredentialExchangeProvider } from './CredentialExchangeProvider'
import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { MdocRecordProvider } from './MdocProvider'
import { ProofExchangeProvider } from './ProofExchangeProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcsProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

const AgentContext = createContext<Agent | undefined>(undefined)

export interface AgentProviderProps {
  agent: Agent
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const useAgent = <AppAgent extends Agent<any> = ParadymAppAgent>() => {
  const agentContext = useContext(AgentContext)
  if (!agentContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }

  // Keep this structure for backwards compat
  return {
    agent: agentContext as AppAgent,
    loading: false,
  }
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => {
  const DynamicProviders = [
    agent.modules.proofs || agent.modules.credentials
      ? ({ children }: PropsWithChildren<{ agent: EitherAgent }>) => (
          <ExchangeRecordDisplayMetadataProvider agent={agent as ParadymAppAgent}>
            {children}
          </ExchangeRecordDisplayMetadataProvider>
        )
      : undefined,
    agent.modules.credentials ? CredentialExchangeProvider : undefined,
    agent.modules.proofs ? ProofExchangeProvider : undefined,
    agent.modules.connections ? ConnectionProvider : undefined,
  ].filter((p): p is Exclude<typeof p, undefined> => p !== undefined)

  const providers = DynamicProviders.reduce(
    (children, Provider, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
      <Provider key={index} agent={agent}>
        {children}
      </Provider>
    ),

    <W3cCredentialRecordProvider agent={agent}>
      <SdJwtVcRecordProvider agent={agent}>
        <MdocRecordProvider agent={agent}>{children}</MdocRecordProvider>
      </SdJwtVcRecordProvider>
    </W3cCredentialRecordProvider>
  )

  return <AgentContext.Provider value={agent}>{providers}</AgentContext.Provider>
}
