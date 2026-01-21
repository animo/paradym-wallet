import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export { BaseAgent, DidCommAgent, OpenId4VcAgent } from './agent'
export { DigitalCredentialsRequest } from './dcApi'
export { CredentialForDisplay, DisplayImage, CredentialIssuerDisplay, CredentialDisplay } from './display/credential'
export * from './error'
export {
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential
} from './format/submission'
export { useCredentialByCategory, useDidCommCredentialActions, useParadym,CredentialId, useCredentialById,useDidCommPresentationActions,useDidCommConnectionActions,useActivities, useInboxNotifications,useHasInboxNotifications, useCredentials, useRefreshedDeferredCredentials } from './hooks'
export { InvitationQrTypes, InvitationType } from './invitation/parser'
export {ResolveOutOfBandInvitationResult } from './invitation/resolver'
export { LogLevel, ParadymWalletSdkConsoleLogger, ParadymWalletSdkLogger } from './logging'
export { OpenId4VcCredentialMetadata } from './metadata/credentials'
export type { CredentialsForProofRequest } from './openid4vc/func/resolveCredentialRequest'
export { FormattedTransactionData, QtspInfo } from './openid4vc/transaction'
export { ParadymWalletSdk, SetupParadymWalletSdkOptions } from './ParadymWalletSdk'
export type {
  CredentialRecord,
  MdocRecord,
  SdJwtVcRecord,
  W3cCredentialRecord,
  W3cV2CredentialRecord,
} from './storage/credentials'
export type { Activity, ActivityType } from './storage/activityStore'
export { TrustList } from './trust/handlers/eudiRpAuthentication'
export { TrustedX509Entity } from './trust/handlers/x509'
export { TrustedEntity, TrustMechanism } from './trust/trustMechanism'
export {CredentialCategoryMetadata} from './metadata/credentials'
export { IssuanceActivity, PresentationActivity, SignedActivity,SharingFailureReason  } from './storage/activityStore'

/**
 *
 * Exports from third-party libraries so they can be reused
 *  Should only be types/enums/consts/etc.
 *
 */

// FIXME: create two types in Credo so we can easily only have type for one flow
export type OpenId4VciResolvedOauth2RedirectAuthorizationRequest = Exclude<
  OpenId4VciResolvedAuthorizationRequest,
  { authorizationFlow: OpenId4VciAuthorizationFlow.PresentationDuringIssuance }
>
export { SdJwtVcTypeMetadata, type SdJwtVc } from '@credo-ts/core'
export {
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  OpenId4VciTxCode,
} from '@credo-ts/openid4vc'

/**
 *
 * below are exports that are required for the eayspid app, but should be removed as the sdk should be used in a simpler way
 *
 *
 */

export { getDisclosedAttributeNamesForDisplay, getUnsatisfiedAttributePathsForDisplay, metadataForDisplay,getCredentialDisplayWithDefaults  } from './display/common'
export {getCredentialForDisplay,getCredentialForDisplayId } from './display/credential'
export {getOpenId4VcCredentialDisplay } from './display/openid4vc'
export { parseInvitationUrl,parseInvitationUrlSync } from './invitation/parser'
export { ResolveCredentialOfferReturn, receiveCredentialFromOpenId4VciOffer } from './invitation/resolver'
export {
  getCredentialCategoryMetadata,
  getOpenId4VcCredentialMetadata,
  getRefreshCredentialMetadata,
  setCredentialCategoryMetadata,
  setOpenId4VcCredentialMetadata,
  setRefreshCredentialMetadata,
  extractOpenId4VcCredentialMetadata
} from './metadata/credentials'
export { acquireAuthorizationCodeAccessToken } from './openid4vc/func/acquireAuthorizationCodeAccessToken'
export { acquireRefreshTokenAccessToken } from './openid4vc/func/acquireRefreshTokenAccessToken'
export { secureWalletKey, useCanUseBiometryBackedWalletKey, useIsBiometricsEnabled } from './secure'
export { kdf } from './secure/kdf'
export { activityStorage, ActivityStatus, storeSharedActivityForCredentialsForRequest, storeReceivedActivity,storeSharedActivityForSubmission  } from './storage/activityStore'
export { storeCredential, updateCredential } from './storage/credentials'
export { DeferredCredentialBefore } from './storage/deferredCredentialStore'
export { getHostNameFromUrl} from './utils/url'
export { getFormattedTransactionData } from './openid4vc/transaction'
export {deferredCredentialStorage, getDeferredCredentialNextCheckAt, useDeferredCredentials, deleteDeferredCredential } from './storage/deferredCredentialStore'
export { fetchAndProcessDeferredCredentials } from './openid4vc/deferredCredentialRecord'
