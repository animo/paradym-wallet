import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export type { CredentialForDisplayId} from './display/credential' 
export type { BaseAgent, DidCommAgent, OpenId4VcAgent } from './agent'
export { DigitalCredentialsRequest } from './dcApi'
export { type DcApiRegisterCredentialsOptions} from './dcApi/registerCredentials'
export type { CredentialForDisplay, DisplayImage, CredentialIssuerDisplay, CredentialDisplay } from './display/credential'
export * from './error'
export type {
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntrySatisfied,
  FormattedSubmissionEntrySatisfiedCredential
} from './format/submission'
export { useCredentialByCategory, useDidCommCredentialActions, useParadym,type CredentialId, useCredentialById,useDidCommPresentationActions,useDidCommConnectionActions,useActivities, useInboxNotifications,useHasInboxNotifications, useCredentials, useRefreshedDeferredCredentials } from './hooks'
export { InvitationQrTypes, type InvitationType } from './invitation/parser'
export type { ResolveOutOfBandInvitationResult } from './invitation/resolver'
export { LogLevel, ParadymWalletSdkConsoleLogger, ParadymWalletSdkLogger } from './logging'
export type { OpenId4VcCredentialMetadata } from './metadata/credentials'
export type { CredentialsForProofRequest } from './openid4vc/func/resolveCredentialRequest'
export type { FormattedTransactionData, QtspInfo } from './openid4vc/transaction'
export { ParadymWalletSdk, type SetupParadymWalletSdkOptions } from './ParadymWalletSdk'
export type {
  CredentialRecord,
  MdocRecord,
  SdJwtVcRecord,
  W3cCredentialRecord,
  W3cV2CredentialRecord,
} from './storage/credentials'
export type { Activity, ActivityType } from './storage/activityStore'
export { type FormattedAttribute, type FormattedAttributeArray, type FormattedAttributeObject, type FormattedAttributeDate, type FormattedAttributeNumber, type FormattedAttributePrimitive, type FormattedAttributeString, formatAllAttributes, formatAttributesWithRecordMetadata  } from './format/attributes'
export type { TrustedDidEntity } from './trust/handlers/did'
export type { TrustedOpenId4VciIssuerEntity } from './trust/handlers/openId4VciIssuer'
export type { TrustList } from './trust/handlers/eudiRpAuthentication'
export type { TrustedX509Entity } from './trust/handlers/x509'
export type { TrustedEntity, TrustMechanism } from './trust/trustMechanism'
export type { CredentialCategoryMetadata } from './metadata/credentials'
export type { IssuanceActivity, PresentationActivity, SignedActivity, SharingFailureReason  } from './storage/activityStore'

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
export { type ResolveCredentialOfferReturn, receiveCredentialFromOpenId4VciOffer } from './invitation/resolver'
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
export { activityStorage, type ActivityStatus, storeSharedActivityForCredentialsForRequest, storeReceivedActivity,storeSharedActivityForSubmission  } from './storage/activityStore'
export { storeCredential, updateCredential } from './storage/credentials'
export { type DeferredCredentialBefore } from './storage/deferredCredentialStore'
export { getHostNameFromUrl} from './utils/url'
export { getFormattedTransactionData } from './openid4vc/transaction'
export {deferredCredentialStorage, getDeferredCredentialNextCheckAt, useDeferredCredentials, deleteDeferredCredential } from './storage/deferredCredentialStore'
export { fetchAndProcessDeferredCredentials } from './openid4vc/deferredCredentialRecord'
