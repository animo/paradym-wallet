import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { CredentialRecord } from '../../storage/credentials'
import type { CredentialsForProofRequest } from '../getCredentialsForProofRequest'
import { type AcquireCredentialsAuthOptions, acquireCredentialsAuth } from './acquireCredentialsAuth'
import { shareCredentials } from './shareCredentials'

export type AcquireCredentialsAuthPresentationDuringIssuanceOptions = Omit<
  AcquireCredentialsAuthOptions,
  'authorizationCode'
> & {
  credentialsForRequest: CredentialsForProofRequest
  refreshCredentialsCallback?: (paradym: ParadymWalletSdk, credentialRecord: CredentialRecord) => Promise<void> | void
}

export const acquireCredentialsAuthPresentationDuringIssuance = async (
  options: AcquireCredentialsAuthPresentationDuringIssuanceOptions
) => {
  const { presentationDuringIssuanceSession } = await shareCredentials({
    paradym: options.paradym,
    resolvedRequest: options.credentialsForRequest,
    selectedCredentials: {},
    refreshCredentialsCallback: options.refreshCredentialsCallback,
  })

  if (!('authSession' in options.resolvedAuthorizationRequest)) {
    throw new Error('Auth session is not available in the resolved authorization request')
  }

  const { authorizationCode } = await options.paradym.agent.openid4vc.holder.retrieveAuthorizationCodeUsingPresentation(
    {
      authSession: options.resolvedAuthorizationRequest.authSession,
      resolvedCredentialOffer: options.resolvedCredentialOffer,
      presentationDuringIssuanceSession,
      dpop: options.resolvedAuthorizationRequest.dpop
        ? {
            alg: options.resolvedAuthorizationRequest.dpop.jwk.supportedSignatureAlgorithms[0],
            jwk: options.resolvedAuthorizationRequest.dpop.jwk,
          }
        : undefined,
    }
  )

  return await acquireCredentialsAuth({ ...options, authorizationCode })
}
