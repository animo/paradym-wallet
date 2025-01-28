import { useAgent } from '@package/agent'
import { type EasyPIDAppAgent, type ParadymAppAgent, isEasyPIDAgent, isParadymAgent } from '@package/agent/src/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'
import type { initializeAppAgent } from './initialize'

export { initializeAppAgent } from './initialize'

export type AppAgent = Awaited<ReturnType<typeof initializeAppAgent>>
export const useAppAgent = useAgent<AppAgent>
export type SecureUnlockContext = { agent: AppAgent }

export const useEasyPIDAgent = () => {
  const agent = useAppAgent()
  if (!isEasyPIDAgent(agent.agent)) {
    throw new Error('Expected EasyPID agent')
  }

  const { agent: originalAgent, ...rest } = agent
  return {
    agent: originalAgent as EasyPIDAppAgent,
    ...rest,
  }
}

export const useParadymAgent = () => {
  const agent = useAppAgent()
  if (!isParadymAgent(agent.agent)) {
    throw new Error('Expected Paradym agent')
  }

  const { agent: originalAgent, ...rest } = agent
  return {
    agent: originalAgent as ParadymAppAgent,
    ...rest,
  }
}

export const useSecureUnlock = () => _useSecureUnlock<SecureUnlockContext>()
