import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export type { OpenId4VciTxCode, OpenId4VciDpopRequestOptions } from '@credo-ts/openid4vc'
export {
  initializeParadymAgent,
  initializeEasyPIDAgent,
  ParadymAppAgent,
  EasyPIDAppAgent,
  EitherAgent,
  isEasyPIDAgent,
  isParadymAgent,
} from './agent'
export * from './invitation'
export * from './crypto'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'

export * from './utils/trust'
