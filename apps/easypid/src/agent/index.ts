import { type EasyPIDAppAgent, useAgent } from '@package/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'

export { initializeAppAgent } from './initialize'

export const useAppAgent = useAgent<EasyPIDAppAgent>
export type AppAgent = EasyPIDAppAgent
export type SecureUnlockContext = { agent: AppAgent }

export const useSecureUnlock = () => _useSecureUnlock<SecureUnlockContext>()
