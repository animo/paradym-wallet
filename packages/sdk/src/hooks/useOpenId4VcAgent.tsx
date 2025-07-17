import { type OpenId4VcAgent, assertOpenId4VcAgent } from '../agent'
import { useAgent } from '../providers/AgentProvider'

export const useOpenId4VcAgent = () => {
  const { agent } = useAgent<OpenId4VcAgent>()
  assertOpenId4VcAgent(agent)
  return { agent }
}
