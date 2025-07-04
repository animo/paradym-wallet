import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'
export {
  setRefreshCredentialMetadata,
  RefreshCredentialMetadata,
  getRefreshCredentialMetadata,
} from './openid4vc/refreshMetadata'

// @ts-ignore
global.Buffer = Buffer

export type { OpenId4VciTxCode, OpenId4VciDpopRequestOptions } from '@credo-ts/openid4vc'
export {
  initializeParadymAgent,
  initializeEasyPIDAgent,
  useAgent,
  ParadymAppAgent,
  EasyPIDAppAgent,
  EitherAgent,
  isEasyPIDAgent,
  isParadymAgent,
} from './agent'
export * from './providers'
export * from './invitation'
export * from './display'
export * from './hooks'
export {
  FormattedSubmission,
  FormattedSubmissionEntry,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential,
  formatDifPexCredentialsForRequest,
} from './format/formatPresentation'
export { getSubmissionForMdocDocumentRequest } from './format/mdocRequest'
export * from './mediation'
export * from './crypto'
export * from './storage'
export * from './openid4vc/displayMetadata'
export * from './credentialCategoryMetadata'
export { migrateLegacyParadymWallet } from './migrateLegacyParadymWallet'

export * from './utils/trust'

export {
  resolveRequestForDcApi,
  sendResponseForDcApi,
  sendErrorResponseForDcApi,
} from './openid4vc/dcApi'
export { registerCredentialsForDcApi } from './openid4vc/registerDcApi'
