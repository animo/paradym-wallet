import 'react-native-get-random-values'
import 'fast-text-encoding'

import { Buffer } from '@credo-ts/core'

// @ts-ignore
global.Buffer = Buffer

export {
  initializeFullAgent,
  initializeEasyPIDAgent,
  useAgent,
  FullAppAgent,
  EasyPIDAppAgent,
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
export * from './storage'
export * from './openid4vc/metadata'
