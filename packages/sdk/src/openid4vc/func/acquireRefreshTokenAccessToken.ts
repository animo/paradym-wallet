import {
  getOid4vcCallbacks,
  type OpenId4VciDpopRequestOptions,
  type OpenId4VciRequestTokenResponse,
  type OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import { clientAuthenticationNone, getAuthorizationServerMetadataFromList, Oauth2Client } from '@openid4vc/oauth2'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'

export type AcquireRefreshTokenAccessTokenOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  authorizationServer: string
  clientId: string
  refreshToken: string
  dpop?: OpenId4VciDpopRequestOptions
}

export async function acquireRefreshTokenAccessToken({
  paradym,
  authorizationServer,
  resolvedCredentialOffer,
  clientId,
  refreshToken,
  dpop,
}: AcquireRefreshTokenAccessTokenOptions): Promise<OpenId4VciRequestTokenResponse> {
  const oauth2Client = new Oauth2Client({
    callbacks: {
      ...getOid4vcCallbacks(paradym.agent.context),
      // TODO: support client attestation for pid referesh
      clientAuthentication: clientAuthenticationNone({ clientId }),
    },
  })

  // TODO: dpop retry also for this method
  const accessTokenResponse = await oauth2Client.retrieveRefreshTokenAccessToken({
    refreshToken,
    resource: resolvedCredentialOffer.credentialOfferPayload.credential_issuer,
    authorizationServerMetadata: getAuthorizationServerMetadataFromList(
      resolvedCredentialOffer.metadata.authorizationServers,
      authorizationServer
    ),
    additionalRequestPayload: {
      client_id: clientId,
    },
    dpop: dpop
      ? {
          nonce: dpop.nonce,
          signer: {
            method: 'jwk',
            alg: dpop.alg,
            publicJwk: dpop.jwk.toJson(),
          },
        }
      : undefined,
  })

  return {
    accessToken: accessTokenResponse.accessTokenResponse.access_token,
    cNonce: accessTokenResponse.accessTokenResponse.c_nonce,
    dpop: dpop ? { ...dpop, nonce: accessTokenResponse.dpop?.nonce } : undefined,
    accessTokenResponse: accessTokenResponse.accessTokenResponse,
  }
}
