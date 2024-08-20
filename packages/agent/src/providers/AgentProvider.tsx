import type { Agent } from '@credo-ts/core'
import type { PropsWithChildren } from 'react'

import NativeAgentProvider from '@credo-ts/react-hooks'

import { SeedCredentialProvider } from '@ausweis/storage'
import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcsProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

export interface AgentProviderProps {
  agent: Agent
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => (
  <NativeAgentProvider agent={agent}>
    <W3cCredentialRecordProvider agent={agent}>
      <SdJwtVcRecordProvider agent={agent}>
        <SeedCredentialProvider agent={agent}>
          <ExchangeRecordDisplayMetadataProvider>{children}</ExchangeRecordDisplayMetadataProvider>
        </SeedCredentialProvider>
      </SdJwtVcRecordProvider>
    </W3cCredentialRecordProvider>
  </NativeAgentProvider>
)
