import { type AusweisAppAgent, useAgent } from '@package/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'

export { initializeAppAgent } from './initialize'

export const useAppAgent = useAgent<AusweisAppAgent>
export type AppAgent = AusweisAppAgent
export type SecureUnlockContext = { agent: AppAgent }

export const useSecureUnlock = () => _useSecureUnlock<SecureUnlockContext>()
