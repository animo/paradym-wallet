import 'react-native-get-random-values'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export {
  initializeFullAgent,
  initializeOpenId4VcHolderAgent,
  useAgent,
  FullAppAgent,
  OpenId4VcHolderAppAgent,
} from './agent'
export * from './providers'
export * from './invitation'
export * from './display'
export * from './hooks'
export {
  FormattedSubmission,
  FormattedSubmissionEntry,
  formatDifPexCredentialsForRequest,
} from './format/formatPresentation'
export * from './mediation'
export * from './crypto'
