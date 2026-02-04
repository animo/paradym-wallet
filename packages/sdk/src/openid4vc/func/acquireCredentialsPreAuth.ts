import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { acquirePreAuthorizedAccessToken } from '../../invitation/resolver'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { retrieveCredentials } from './retrieveCredentials'

export type AcquireCredentialsPreAuthOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
}

export const acquireCredentialsPreAuth = async (options: AcquireCredentialsPreAuthOptions) => {
  // We want the first supported configuration id
  // TODO: handle empty configuration ids
  const configurationId = options.resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(options.resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined

  if (!configurationId) {
    throw new Error('Could not establish the configuration id')
  }

  const tokenResponse = await acquirePreAuthorizedAccessToken({
    paradym: options.paradym,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
  })

  return await retrieveCredentials({
    paradym: options.paradym,
    tokenResponse,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    configurationId,
  })
}
