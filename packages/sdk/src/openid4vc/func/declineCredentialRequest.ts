import type { Openid4vpAuthorizationRequestError } from '@credo-ts/openid4vc'
import { Linking } from 'react-native'
import { assertAgentType } from '../../agent'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { storeSharedActivityForCredentialsForRequest } from '../../storage/activityStore'
import type { CredentialsForProofRequest } from '../func/resolveCredentialRequest'
import { type FormattedTransactionData, getFormattedTransactionData } from '../transaction'

export type DeclineCredentialRequestOptions = { paradym: ParadymWalletSdk } & (
  | {
      resolvedRequest: CredentialsForProofRequest
      /**
       * The transaction the user was shown, where the caller already resolved one.
       *
       * Worth passing for a PaSO request: resolving one is asynchronous, so the synchronous fallback
       * below cannot describe it and the declined activity would be recorded without its transaction.
       */
      transactionData?: FormattedTransactionData
    }
  | {
      /**
       * The error `resolveCredentialRequest` threw for an invalid request, to send to the verifier.
       */
      authorizationRequestError: Openid4vpAuthorizationRequestError
    }
)

/**
 * Sends an OpenID4VP error response to the verifier and opens the `redirect_uri` it returns.
 * Without a `redirectUri` in the result, the user has to go back to the app that started the request.
 */
export const declineCredentialRequest = async (options: DeclineCredentialRequestOptions) => {
  const { paradym } = options
  assertAgentType(paradym.agent, 'openid4vc')

  if ('resolvedRequest' in options) {
    const { resolvedRequest, transactionData } = options
    await storeSharedActivityForCredentialsForRequest(
      paradym,
      resolvedRequest,
      resolvedRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
      transactionData ?? getFormattedTransactionData(resolvedRequest)
    )
  }

  try {
    // Credo sends `access_denied` for a resolved request, which [OpenID4VP] Section 8.5 uses both for a
    // user who declines and for a wallet that lacks the credentials. It leaves out the `redirectUri` of a
    // verifier it could not authenticate.
    const result = await paradym.agent.openid4vc.holder.declineOpenId4VpAuthorizationRequest(
      'resolvedRequest' in options
        ? {
            authorizationRequestPayload: options.resolvedRequest.authorizationRequest,
            origin: options.resolvedRequest.origin,
          }
        : { authorizationRequestError: options.authorizationRequestError }
    )

    const redirectUri = 'redirectUri' in result ? result.redirectUri : undefined
    if (redirectUri) await Linking.openURL(redirectUri)

    return { redirectUri }
  } catch (error) {
    paradym.logger.error('Failed to send the authorization error response', { error })
    return { redirectUri: undefined }
  }
}
