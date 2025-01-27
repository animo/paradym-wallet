import { useAgent } from '@package/agent'
import type { EitherAgent } from '@package/agent/src/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'

export { initializeAppAgent } from './initialize'

export const useAppAgent = useAgent<EitherAgent>
export type AppAgent = EitherAgent
export type SecureUnlockContext = { agent: AppAgent }

export const useSecureUnlock = () => _useSecureUnlock<SecureUnlockContext>()
