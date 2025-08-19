// TODO(sdk): more stricly define the exports

import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export { ParadymWalletSdk, type ParadymWalletSdkOptions } from './ParadymWalletSdk'
export { logger, LogLevel } from './logger'

export {
  OpenId4VciTxCode,
  OpenId4VciAuthorizationFlow,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedCredentialOffer,
  type OpenId4VciResolvedAuthorizationRequest,
} from '@credo-ts/openid4vc'

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
