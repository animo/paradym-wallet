import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { acquirePreAuthorizedAccessToken } from '@paradym/wallet-sdk/invitation/resolver'
import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
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
    paradym: options.paradym,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    txCode: options.transactionCode,
  })

  return await retrieveCredentials({
    paradym: options.paradym,
    tokenResponse,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    configurationId,
  })
}
