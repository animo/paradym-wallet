import type { AgentForAgentType, AgentType, AnyAgent, DidCommAgent, FullAgent, OpenId4VcAgent } from './agent'
import { ParadymWalletMustBeAgentTypeError } from './error'

export const isDidcommAgent = (agent: AnyAgent): agent is DidCommAgent => 'didcomm' in agent
export function assertDidcommAgent(agent: AnyAgent): asserts agent is DidCommAgent {
  assertAgentType(agent, 'didcomm')
}

export const isFullAgent = (agent: AnyAgent): agent is FullAgent => isDidcommAgent(agent) && isOpenId4VcAgent(agent)
export function assertFullAgent(agent: AnyAgent): asserts agent is FullAgent {
  assertAgentType(agent, 'full')
}

export const isOpenId4VcAgent = (agent: AnyAgent): agent is OpenId4VcAgent => 'openid4vc' in agent
export function assertOpenId4VcAgent(agent: AnyAgent): asserts agent is OpenId4VcAgent {
  assertAgentType(agent, 'openid4vc')
}

export function isAgentType<T extends AgentType>(agent: AnyAgent, agentType: T): agent is AgentForAgentType<T> {
  if (agentType === 'didcomm') return isDidcommAgent(agent)
  if (agentType === 'openid4vc') return isOpenId4VcAgent(agent)
  return isFullAgent(agent)
}

export function assertAgentType<T extends AgentType>(
  agent: AnyAgent,
  agentType: T
): asserts agent is AgentForAgentType<T> {
  if (!isAgentType(agent, agentType)) {
    throw new ParadymWalletMustBeAgentTypeError(agentType)
  }
}
