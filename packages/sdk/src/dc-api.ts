/**
 *
 * Entry point for the credential request UI: the Android activity or iOS identity document provider
 * extension a digital credentials API request opens in.
 *
 * That UI is bundled separately from the app, and the iOS extension runs on a much tighter memory
 * budget. The package root pulls in didcomm, anoncreds, issuance and react-query, so this entry only
 * exports what answering a request needs, each from its own module.
 *
 */

export { type DcApiReview, ParadymDcApiSdk, type ParadymDcApiSdkOptions } from './dcApi/ParadymDcApiSdk'
export {
  getClosestPartialMatch,
  getDisclosedAttributeNamesForDisplay,
  getRequestedAttributeNamesForDisplay,
  getUnmetAttributeRequirements,
  hasMissingCards,
} from './display/common'
export * from './error'
export type {
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntryPartialMatch,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential,
} from './format/submission'
export { LogLevel } from './logging/ParadymWalletSdkLogger'
export { getWalletKeyUsingBiometrics, getWalletKeyUsingPin } from './secure/walletKey'
export { getIsBiometricsEnabled, getWalletKeyVersion } from './storage/sharedMmkv'
export type { TrustMechanism } from './trust/trustMechanism'
export type { RequestVerifier } from './trust/verifier'
