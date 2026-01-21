import type { OpenId4VciResolvedAuthorizationRequest, OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'

export type AcquireAuthorizationCodeAccessTokenOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest
  authorization: {
    clientId: string
    redirectUri: string
  }
  authorizationCode: string
}

export const acquireAuthorizationCodeAccessToken = async (options: AcquireAuthorizationCodeAccessTokenOptions) => {
  const tokenResponse = await options.paradym.agent.openid4vc.holder.requestToken({
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    redirectUri: options.authorization.redirectUri,
    code: options.authorizationCode,
    clientId: options.authorization.clientId,
    dpop: options.resolvedAuthorizationRequest.dpop
      ? {
          alg: options.resolvedAuthorizationRequest.dpop.jwk.supportedSignatureAlgorithms[0],
          jwk: options.resolvedAuthorizationRequest.dpop.jwk,
        }
      : undefined,
    codeVerifier:
      'codeVerifier' in options.resolvedAuthorizationRequest
        ? options.resolvedAuthorizationRequest.codeVerifier
        : undefined,
  })

  return tokenResponse
}
