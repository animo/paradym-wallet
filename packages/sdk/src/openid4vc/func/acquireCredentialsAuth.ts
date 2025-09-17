import type { OpenId4VciResolvedAuthorizationRequest, OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
import { retrieveCredentials } from './retrieveCredentials'

export type AcquireCredentialsAuthOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  resolvedAuthorizationRequest: OpenId4VciResolvedAuthorizationRequest
  authorization: {
    clientId: string
    redirectUri: string
  }
  authorizationCode: string
}

export const acquireCredentialsAuth = async (options: AcquireCredentialsAuthOptions) => {
  const configurationId = Object.keys(options.resolvedCredentialOffer.offeredCredentialConfigurations)[0]

  const tokenResponse = await options.paradym.agent.modules.openId4VcHolder.requestToken({
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    redirectUri: options.authorization.redirectUri,
    code: options.authorizationCode,
    clientId: options.authorization.clientId,
    codeVerifier:
      'codeVerifier' in options.resolvedAuthorizationRequest
        ? options.resolvedAuthorizationRequest.codeVerifier
        : undefined,
  })

  const credential = await retrieveCredentials({
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    authorization: options.authorization,
    paradym: options.paradym,
    configurationId,
    tokenResponse,
    resolvedAuthorizationRequest: options.resolvedAuthorizationRequest,
  })

  return credential
}
