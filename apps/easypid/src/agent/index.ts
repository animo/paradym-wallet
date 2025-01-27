import { useAgent } from '@package/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'
import type { initializeAppAgent } from './initialize'

export { initializeAppAgent } from './initialize'

export type AppAgent = Awaited<ReturnType<typeof initializeAppAgent>>
export const useAppAgent = useAgent<AppAgent>
export type SecureUnlockContext = { agent: AppAgent }

export const useSecureUnlock = () => _useSecureUnlock<SecureUnlockContext>()
