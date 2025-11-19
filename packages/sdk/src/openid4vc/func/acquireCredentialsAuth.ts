import {
  type AcquireAuthorizationCodeAccessTokenOptions,
  acquireAuthorizationCodeAccessToken,
} from './acquireAuthorizationCodeAccessToken'
import { retrieveCredentials } from './retrieveCredentials'

export type AcquireCredentialsAuthOptions = AcquireAuthorizationCodeAccessTokenOptions

export const acquireCredentialsAuth = async (options: AcquireCredentialsAuthOptions) => {
  const configurationId = Object.keys(options.resolvedCredentialOffer.offeredCredentialConfigurations)[0]

  const tokenResponse = await acquireAuthorizationCodeAccessToken(options)

  return await retrieveCredentials({
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    authorization: options.authorization,
    paradym: options.paradym,
    configurationId,
    tokenResponse,
    resolvedAuthorizationRequest: options.resolvedAuthorizationRequest,
  })
}
