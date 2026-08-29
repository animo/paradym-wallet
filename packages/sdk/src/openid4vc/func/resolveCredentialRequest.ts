import { assertAgentType } from '../../agent'
import { ParadymWalletNoRequestToResolveError } from '../../error'
import { getFormattedSubmission } from '../../format/submission'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { getVerifierForOpenId4VpRequest } from '../../trust/verifier'

export type ResolveCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  requestPayload?: Record<string, unknown>
  uri?: string
  allowUntrusted?: boolean
  origin?: string
}

export const resolveCredentialRequest = async ({
  paradym,
  uri,
  requestPayload,
  origin,
  allowUntrusted,
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
      allowUntrusted,
    })

    return {
      ...resolved.presentationExchange,
      ...resolved.dcql,
      origin,
      authorizationRequest: resolved.authorizationRequestPayload,
      formattedSubmission: getFormattedSubmission(resolved),
      transactionData: resolved.transactionData,
      trustMechanism,
      verifier,
    }
  } catch (error) {
    paradym.logger.error('Error getting credentials for request', {
      error,
    })

    throw error
  }
}

export type CredentialsForProofRequest = Awaited<ReturnType<typeof resolveCredentialRequest>>
