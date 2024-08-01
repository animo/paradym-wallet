import { type FunkeAppAgent, useAgent } from '@package/agent'
import { useSecureUnlock as _useSecureUnlock } from '@package/secure-store/secureUnlock'

export { initializeAppAgent } from './initialize'

export const useAppAgent = useAgent<FunkeAppAgent>
export type AppAgent = FunkeAppAgent

export const useSecureUnlock = () => _useSecureUnlock<{ agent?: AppAgent }>()
