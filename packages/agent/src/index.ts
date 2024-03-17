import 'react-native-get-random-values'
import 'fast-text-encoding'

import { Buffer } from '@credo-ts/core'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line no-undef
global.Buffer = Buffer

export { initializeAgent, useAgent, AppAgent } from './agent'
export * from './providers'
export * from './parsers'
export * from './display'
export * from './hooks'
export {
  FormattedSubmission,
  FormattedSubmissionEntry,
  formatDifPexCredentialsForRequest,
} from './format/formatPresentation'
export * from './mediation'
