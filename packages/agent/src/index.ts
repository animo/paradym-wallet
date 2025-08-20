import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export { logger } from './logger'
export type { OpenId4VciTxCode, OpenId4VciDpopRequestOptions } from '@credo-ts/openid4vc'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'

export * from './invitation'
export * from './crypto'
