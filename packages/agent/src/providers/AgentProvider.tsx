import type { Agent } from '@credo-ts/core'
import type { PropsWithChildren } from 'react'

import NativeAgentProvider from '@credo-ts/react-hooks'

import { ExchangeRecordDisplayMetadataProvider } from './ExchangeRecordDisplayMetadataProvider'
import { MdocRecordProvider } from './MdocProvider'
import { SdJwtVcRecordProvider } from './SdJwtVcsProvider'
import { TrustedEntitiesProvider } from './TrustedEntitiesProvider'
import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

export interface AgentProviderProps {
  agent: Agent
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => (
  <NativeAgentProvider agent={agent}>
    <W3cCredentialRecordProvider agent={agent}>
      <SdJwtVcRecordProvider agent={agent}>
        <MdocRecordProvider agent={agent}>
          <ExchangeRecordDisplayMetadataProvider>
            <TrustedEntitiesProvider agent={agent}>{children}</TrustedEntitiesProvider>
          </ExchangeRecordDisplayMetadataProvider>
        </MdocRecordProvider>
      </SdJwtVcRecordProvider>
    </W3cCredentialRecordProvider>
  </NativeAgentProvider>
)
