import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export {
  OpenId4VciAuthorizationFlow,
  OpenId4VciDeferredCredentialResponse,
  OpenId4VciMetadata,
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
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

export * from './error'
export {
  acceptOutOfBandInvitation,
  acquireAuthorizationCodeAccessToken,
  acquireAuthorizationCodeUsingPresentation,
  acquirePreAuthorizedAccessToken,
  acquireRefreshTokenAccessToken,
  type CredentialsForProofRequest,
  getCredentialsForProofRequest,
  type ResolveOutOfBandInvitationResultSuccess,
  receiveCredentialFromOpenId4VciOffer,
  receiveDeferredCredentialFromOpenId4VciOffer,
  resolveOpenId4VciOffer,
  resolveOutOfBandInvitation,
  type TrustedX509Entity,
} from './handler'
export {
  InvitationQrTypes,
  InvitationType,
  ParseInvitationResultError,
  parseDidCommInvitation,
  parseInvitationUrl,
  parseInvitationUrlSync,
} from './parsers'
export * from './transactions'
export type { TrustedEntity } from './trustedEntities'
