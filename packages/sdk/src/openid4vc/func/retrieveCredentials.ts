import type {
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
import { getCredentialForDisplay } from '@paradym/wallet-sdk/display/credential'
import { receiveCredentialFromOpenId4VciOffer } from '@paradym/wallet-sdk/invitation/resolver'

export type RetrieveCredentialOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  tokenResponse: OpenId4VciRequestTokenResponse
  configurationId: string
  resolvedAuthorizationRequest?: OpenId4VciResolvedAuthorizationRequest

  // TODO(sdk): can we do this better?
  authorization?: {
    clientId: string
    redirectUri: string
  }
}

export const retrieveCredentials = async (options: RetrieveCredentialOptions) => {
  const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
    paradym: options.paradym,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    credentialConfigurationIdsToRequest: [options.configurationId],
    accessToken: options.tokenResponse,
    clientId: options.authorization ? options.authorization?.clientId : undefined,
    // Always request batch for non pid credentials
    requestBatch: true,
  })

  const { deferredCredentials, credentials } = credentialResponses
  return { deferredCredentials, credentials: credentials.map((c) => getCredentialForDisplay(c.credential)) }
}
