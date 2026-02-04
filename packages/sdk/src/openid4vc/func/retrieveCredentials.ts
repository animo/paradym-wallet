import type {
  OpenId4VciRequestTokenResponse,
  OpenId4VciResolvedAuthorizationRequest,
  OpenId4VciResolvedCredentialOffer,
} from '@credo-ts/openid4vc'
import { type CredentialForDisplay, getCredentialForDisplay } from '../../display/credential'
import { receiveCredentialFromOpenId4VciOffer } from '../../invitation/resolver'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { DeferredCredentialBefore } from '../../storage/deferredCredentialStore'

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

export const retrieveCredentials = async (
  options: RetrieveCredentialOptions
): Promise<{
  deferredCredentials: DeferredCredentialBefore[]
  credentials: CredentialForDisplay[]
}> => {
  const credentialResponses = await receiveCredentialFromOpenId4VciOffer({
    paradym: options.paradym,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    credentialConfigurationIdsToRequest: [options.configurationId],
    accessToken: options.tokenResponse,
    clientId: options.authorization ? options.authorization?.clientId : undefined,
    // Always request batch for non pid credentials
    requestBatch: true,
  })

  const deferredCredentials = credentialResponses.deferredCredentials.map((dc) => ({
    accessToken: {
      ...options.tokenResponse,
      dpop: options.tokenResponse.dpop
        ? { ...options.tokenResponse.dpop, jwk: options.tokenResponse.dpop.jwk.toJson() }
        : undefined,
    },
    response: dc,
    issuerMetadata: options.resolvedCredentialOffer.metadata,
    clientId: options.authorization?.clientId,
  }))

  return {
    deferredCredentials,
    credentials: credentialResponses.credentials.map((c) => getCredentialForDisplay(c.credential)),
  }
}
