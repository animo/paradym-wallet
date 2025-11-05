import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export type { OpenId4VciTxCode, OpenId4VciDpopRequestOptions } from '@credo-ts/openid4vc'

export * from './invitation'
export * from './crypto'
export * from './storage'
export * from './openid4vc/displayMetadata'
export * from './openid4vc/deferredCredentialRecord'

export * from './credentialCategoryMetadata'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'

export * from './utils/trust'

export {
  resolveRequestForDcApi,
  sendResponseForDcApi,
  sendErrorResponseForDcApi,
} from './openid4vc/dcApi'
export { registerCredentialsForDcApi } from './openid4vc/registerDcApi'
