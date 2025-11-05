import { shareProof } from '@paradym/wallet-sdk/invitation/shareProof'
import type { FetchBatchCredentialCallback } from '../batch'
import type { CredentialsForProofRequest } from '../getCredentialsForProofRequest'
import { type AcquireCredentialsAuthOptions, acquireCredentialsAuth } from './acquireCredentialsAuth'

export type AcquireCredentialsAuthPresentationDuringIssuanceOptions = Omit<
  AcquireCredentialsAuthOptions,
  'authorizationCode'
> & {
  credentialsForRequest: CredentialsForProofRequest
  fetchBatchCredentialCallback?: FetchBatchCredentialCallback
}

export const acquireCredentialsAuthPresentationDuringIssuance = async (
  options: AcquireCredentialsAuthPresentationDuringIssuanceOptions
) => {
  const { presentationDuringIssuanceSession } = await shareProof({
    paradym: options.paradym,
    resolvedRequest: options.credentialsForRequest,
    selectedCredentials: {},
    fetchBatchCredentialCallback: options.fetchBatchCredentialCallback,
  })

  if (!('authSession' in options.resolvedAuthorizationRequest)) {
    throw new Error('Auth session is not available in the resolved authorization request')
  }

  const { authorizationCode } =
    await options.paradym.agent.modules.openId4VcHolder.retrieveAuthorizationCodeUsingPresentation({
      authSession: options.resolvedAuthorizationRequest.authSession,
      resolvedCredentialOffer: options.resolvedCredentialOffer,
      presentationDuringIssuanceSession,
    })

  return await acquireCredentialsAuth({ ...options, authorizationCode })
}
