import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
import { acquirePreAuthorizedAccessToken } from '@paradym/wallet-sdk/invitation/resolver'
import { retrieveCredentials } from './retrieveCredentials'

export type AcquireCredentialsPreAuthWithTransactionCodeOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  transactionCode: string
}

export const acquireCredentialsPreAuthWithTransactionCode = async (
  options: AcquireCredentialsPreAuthWithTransactionCodeOptions
) => {
  // We want the first supported configuration id
  // TODO: handle empty configuration ids
  const configurationId = options.resolvedCredentialOffer?.offeredCredentialConfigurations
    ? Object.keys(options.resolvedCredentialOffer.offeredCredentialConfigurations)[0]
    : undefined

  if (!configurationId) {
    throw new Error('Could not establish the configuration id')
  }

  const tokenResponse = await acquirePreAuthorizedAccessToken({
    agent: options.paradym.agent,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
  })

  return await retrieveCredentials({
    paradym: options.paradym,
    tokenResponse,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    configurationId,
  })
}
