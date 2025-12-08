import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

export {
  getRefreshCredentialMetadata,
  RefreshCredentialMetadata,
  setRefreshCredentialMetadata,
} from './openid4vc/refreshMetadata'

// @ts-expect-error
global.Buffer = Buffer

export type { OpenId4VciDpopRequestOptions, OpenId4VciTxCode } from '@credo-ts/openid4vc'
export {
  EasyPIDAppAgent,
  EitherAgent,
  initializeEasyPIDAgent,
  initializeParadymAgent,
  isEasyPIDAgent,
  isParadymAgent,
  ParadymAppAgent,
  useAgent,
} from './agent'
export * from './credentialCategoryMetadata'
export * from './crypto'
export * from './display'
export {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential,
  formatDifPexCredentialsForRequest,
} from './format/formatPresentation'
export { getSubmissionForMdocDocumentRequest } from './format/mdocRequest'
export * from './hooks'
export * from './invitation'
export { logger } from './logger'
export * from './mediation'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'
export {
  resolveRequestForDcApi,
  sendErrorResponseForDcApi,
  sendResponseForDcApi,
} from './openid4vc/dcApi'
export * from './openid4vc/deferredCredentialRecord'
export * from './openid4vc/displayMetadata'
export { registerCredentialsForDcApi } from './openid4vc/registerDcApi'
export * from './providers'
export * from './storage'
export * from './utils/trust'
