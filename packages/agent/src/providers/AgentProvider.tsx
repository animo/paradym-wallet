import type { Agent } from '@credo-ts/core'
import { type PropsWithChildren, createContext, useContext } from 'react'

import type { FullAppAgent } from '../agent'
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
export const useAgent = <AppAgent extends Agent<any> = FullAppAgent>() => {
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

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => (
  <CredentialExchangeProvider agent={agent}>
    <ProofExchangeProvider agent={agent}>
      <ConnectionProvider agent={agent}>
        <W3cCredentialRecordProvider agent={agent}>
          <SdJwtVcRecordProvider agent={agent}>
            <MdocRecordProvider agent={agent}>
              <ExchangeRecordDisplayMetadataProvider>{children}</ExchangeRecordDisplayMetadataProvider>
            </MdocRecordProvider>
          </SdJwtVcRecordProvider>
        </W3cCredentialRecordProvider>
      </ConnectionProvider>
    </ProofExchangeProvider>
  </CredentialExchangeProvider>
)
