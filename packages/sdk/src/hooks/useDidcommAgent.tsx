import { type DidCommAgent, assertDidcommAgent } from '../agent'
import { useAgent } from '../providers/AgentProvider'

export const useDidCommAgent = () => {
  const { agent } = useAgent<DidCommAgent>()
  assertDidcommAgent(agent)
  return { agent }
}
