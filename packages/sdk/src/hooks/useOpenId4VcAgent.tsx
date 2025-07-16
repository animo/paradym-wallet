import type { OpenId4VcAgent } from '../agent'
import { ParadymWalletAgentIsNotConfiguredForOpenId4VcError } from '../error'
import { useAgent } from '../providers/AgentProvider'

export const useOpenId4VcAgent = () => {
  const { agent } = useAgent<OpenId4VcAgent>()

  if ('openId4VcHolder' in agent.modules.openId4VcHolder) return { agent }

  throw new ParadymWalletAgentIsNotConfiguredForOpenId4VcError()
}
