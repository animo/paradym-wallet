import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { assertAgentType } from '../../agentType'
import { ParadymWalletNoRequestToResolveError } from '../../error'
import { type FormattedSubmission, getFormattedSubmission } from '../../format/submission'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { getVerifierForOpenId4VpRequest } from '../../trust/verifier'

export type ResolveCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  requestPayload?: Record<string, unknown>
  uri?: string
  origin?: string
}

export const resolveCredentialRequest = async ({
  paradym,
  uri,
  requestPayload,
  origin,
}: ResolveCredentialRequestOptions) => {
  assertAgentType(paradym.agent, 'openid4vc')
  try {
    const requestToResolve = uri ?? requestPayload

    if (!requestToResolve) {
      throw new ParadymWalletNoRequestToResolveError(
        'Either supply a uri or requestPayload to get the credentials for a proof request'
      )
    }

    const resolved = await paradym.agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(requestToResolve, {
      origin,
      // NOTE: add back when enabling federation support
      // trustedFederationEntityIds: paradym.trustMechanisms.find((tm) => tm.trustMechanism === 'openid_federation')
      // ?.trustedEntityIds,
    })

    const { trustMechanism, verifier } = await getVerifierForOpenId4VpRequest({
      agentContext: paradym.agent.context,
      trustMechanisms: paradym.trustMechanisms,
      resolvedAuthorizationRequest: resolved,
    })

    return getCredentialsForProofRequest(resolved, { origin, trustMechanism, verifier })
  } catch (error) {
    paradym.logger.error('Error getting credentials for request', {
      error,
    })

    throw error
  }
}

/**
 * A resolved request in the shape the share flow works with. The credential request UI builds the
 * same from its own resolve, so both share through the same code.
 */
export function getCredentialsForProofRequest(
  resolved: OpenId4VpResolvedAuthorizationRequest,
  { origin, trustMechanism, verifier }: { origin?: string } & Awaited<ReturnType<typeof getVerifierForOpenId4VpRequest>>
) {
  const submission = getFormattedSubmission(resolved)
  // The purpose the verifier registered, over the one it states in the request
  const formattedSubmission: FormattedSubmission = {
    ...submission,
    purpose: verifier.registration?.purpose ?? submission.purpose,
  }

  return {
    ...resolved.presentationExchange,
    ...resolved.dcql,
    origin,
    authorizationRequest: resolved.authorizationRequestPayload,
    // Carries the compact JAR JWT, which PaSO hashes into the `request_integrity` proof claim.
    signedAuthorizationRequest: resolved.signedAuthorizationRequest,
    formattedSubmission,
    transactionData: resolved.transactionData,
    trustMechanism,
    verifier,
  }
}

export type CredentialsForProofRequest = ReturnType<typeof getCredentialsForProofRequest>
