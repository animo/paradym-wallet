import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export type { OpenId4VciTxCode, OpenId4VciDpopRequestOptions } from '@credo-ts/openid4vc'
export {
  initializeParadymAgent,
  initializeEasyPIDAgent,
  isEasyPIDAgent,
  isParadymAgent,
  ParadymAppAgent,
  EasyPIDAppAgent,
  EitherAgent,
  isEasyPIDAgent,
  isParadymAgent,
} from './agent'
export * from './batch'
export * from './providers/AgentProvider'
export * from './invitation'
export * from './hooks'
export * from './mediation'
export * from './crypto'
export * from './storage'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'

export * from './utils/trust'

export {
  resolveRequestForDcApi,
  sendResponseForDcApi,
  sendErrorResponseForDcApi,
} from './openid4vc/dcApi'
export { registerCredentialsForDcApi } from './openid4vc/registerDcApi'
