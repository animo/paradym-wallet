import type { DidCommAgent } from '../agent'
import { ParadymWalletAgentIsNotConfiguredForDidCommError } from '../error'
import { useAgent } from '../providers/AgentProvider'

export const useDidCommAgent = () => {
  const { agent } = useAgent<DidCommAgent>()

  if ('connections' in agent.modules) return { agent }

  throw new ParadymWalletAgentIsNotConfiguredForDidCommError()
}
