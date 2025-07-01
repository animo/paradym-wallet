import { useAgent } from '@package/agent'
import {
  type EasyPIDAppAgent,
  type EitherAgent,
  type ParadymAppAgent,
  isEasyPIDAgent,
  isParadymAgent,
} from '@package/agent/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'

export { initializeAppAgent } from './initialize'

export const useAppAgent = useAgent<EitherAgent>
export type AppAgent = EitherAgent
export type SecureUnlockContext = { agent: EitherAgent }

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
