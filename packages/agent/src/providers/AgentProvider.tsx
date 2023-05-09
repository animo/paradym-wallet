import type { AppAgent } from '../agent'
import type { PropsWithChildren } from 'react'

import NativeAgentProvider from '@aries-framework/react-hooks'

import { W3cCredentialRecordProvider } from './W3cCredentialsProvider'

export interface AgentProviderProps {
  agent: AppAgent
}

export const AgentProvider = ({ agent, children }: PropsWithChildren<AgentProviderProps>) => (
  <NativeAgentProvider agent={agent}>
    <W3cCredentialRecordProvider agent={agent}>{children}</W3cCredentialRecordProvider>
  </NativeAgentProvider>
)
