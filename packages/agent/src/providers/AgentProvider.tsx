import type { AppAgent } from '../agent'
import type { PropsWithChildren } from 'react'

import NativeAgentProvider from '@credo-ts/react-hooks'

import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcsProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

export interface AgentProviderProps {
  agent: AppAgent
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => (
  <NativeAgentProvider agent={agent}>
    <W3cCredentialRecordProvider agent={agent}>
      <SdJwtVcRecordProvider agent={agent}>
        <ExchangeRecordDisplayMetadataProvider>{children}</ExchangeRecordDisplayMetadataProvider>
      </SdJwtVcRecordProvider>
    </W3cCredentialRecordProvider>
  </NativeAgentProvider>
)
