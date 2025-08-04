import type { OpenId4VciAuthorizationFlow, OpenId4VciResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export {
  OpenId4VciResolvedCredentialOffer,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciRequestTokenResponse,
  OpenId4VciAuthorizationFlow,
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

export {
  parseInvitationUrl,
  parseDidCommInvitation,
  InvitationQrTypes,
  InvitationType,
  ParseInvitationResultError,
} from './parsers'
export {
  type CredentialsForProofRequest,
  type TrustedX509Entity,
  type ResolveOutOfBandInvitationResultSuccess,
  acceptOutOfBandInvitation,
  resolveOutOfBandInvitation,
  receiveCredentialFromOpenId4VciOffer,
  acquireAuthorizationCodeAccessToken,
  acquireRefreshTokenAccessToken,
  acquirePreAuthorizedAccessToken,
  resolveOpenId4VciOffer,
  getCredentialsForProofRequest,
  acquireAuthorizationCodeUsingPresentation,
} from './handler'
export * from './error'

export type { TrustedEntity } from './trustedEntities'
export * from './transactions'
