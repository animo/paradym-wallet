// TODO(sdk): more stricly define the exports

import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export {
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedAuthorizationRequest,
  type OpenId4VciResolvedCredentialOffer,
  OpenId4VciTxCode,
} from '@credo-ts/openid4vc'
export * from './hooks'
export * from './logging'
export { ParadymWalletSdk, type ParadymWalletSdkOptions } from './ParadymWalletSdk'
export type {
  CredentialRecord,
  MdocRecord,
  SdJwtVcRecord,
  W3cCredentialRecord,
  W3cV2CredentialRecord,
} from './storage/credentials'

// FIXME: create two types in Credo so we can easily only have type for one flow
export type OpenId4VciResolvedOauth2RedirectAuthorizationRequest = Exclude<
  OpenId4VciResolvedAuthorizationRequest,
  { authorizationFlow: OpenId4VciAuthorizationFlow.PresentationDuringIssuance }
>

// FIXME: create two types in Credo so we can easily only have type for one flow
export type OpenId4VciResolvedPresentationDuringIssuanceAuthorizationRequest = Exclude<
  OpenId4VciResolvedAuthorizationRequest,
  { authorizationFlow: OpenId4VciAuthorizationFlow.Oauth2Redirect }
>
