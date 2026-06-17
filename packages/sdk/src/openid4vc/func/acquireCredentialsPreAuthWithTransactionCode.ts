import type { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { Oauth2ClientErrorResponseError, Oauth2ErrorCodes } from '@openid4vc/oauth2'
import { ParadymWalletInvalidTransactionCodeError } from '../../error'
import { acquirePreAuthorizedAccessToken } from '../../invitation/resolver'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
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

  let tokenResponse: Awaited<ReturnType<typeof acquirePreAuthorizedAccessToken>>
  try {
    tokenResponse = await acquirePreAuthorizedAccessToken({
      paradym: options.paradym,
      resolvedCredentialOffer: options.resolvedCredentialOffer,
      txCode: options.transactionCode,
    })
  } catch (error) {
    if (
      error instanceof Oauth2ClientErrorResponseError &&
      error.errorResponse.error === Oauth2ErrorCodes.InvalidGrant
    ) {
      throw new ParadymWalletInvalidTransactionCodeError()
    }
    throw error
  }

  return await retrieveCredentials({
    paradym: options.paradym,
    tokenResponse,
    resolvedCredentialOffer: options.resolvedCredentialOffer,
    configurationId,
  })
}
