import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import { type DifPresentationExchangeDefinitionV2, Jwt } from '@credo-ts/core'
import { getOpenid4vpClientId } from '@openid4vc/openid4vp'
import type { OpenId4VcAgent } from '../agent'
import { formatDcqlCredentialsForRequest } from '../format/dcqlRequest'
import { formatDifPexCredentialsForRequest } from '../format/presentationExchangeRequest'
import type { FormattedSubmission } from '../format/submission'

export type GetCredentialsForProofRequestOptions = {
  agent: OpenId4VcAgent
  requestPayload: Record<string, unknown>
  allowUntrusted?: boolean
  uri?: string
  origin?: string
}

const extractEntityIdFromPayload = (payload: Record<string, unknown>, origin?: string): string | null => {
  const { clientId, clientIdScheme } = getOpenid4vpClientId({
    clientId: payload.client_id as string,
    legacyClientIdScheme: payload.client_id_scheme,
    responseMode: payload.response_mode,
    origin,
  })

  if (clientIdScheme === 'https') return clientId
  return null
}

const extractEntityIdFromJwt = (jwt: string, origin?: string): string | null => {
  const jwtPayload = Jwt.fromSerializedJwt(jwt).payload

  return extractEntityIdFromPayload(jwtPayload.additionalClaims, origin)
}

export const getCredentialsForProofRequest = async ({
  agent,
  uri,
  allowUntrusted = true,
  requestPayload,
  origin,
}: GetCredentialsForProofRequestOptions) => {
  let request: string | Record<string, unknown>

  const resolved = await agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(requestPayload, {
    origin,
  })

  // TODO: only with EUDI
  const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(agent.context, {
    resolvedAuthorizationRequest: resolved,
    allowUntrustedSigned: allowUntrusted,
  })

  let formattedSubmission: FormattedSubmission
  if (resolved.presentationExchange) {
    formattedSubmission = formatDifPexCredentialsForRequest(
      resolved.presentationExchange.credentialsForRequest,
      resolved.presentationExchange.definition as DifPresentationExchangeDefinitionV2
    )
  } else if (resolved.dcql) {
    formattedSubmission = formatDcqlCredentialsForRequest(resolved.dcql.queryResult)
  } else {
    throw new Error('No presentation exchange or dcql found in authorization request.')
  }

  return {
    ...resolved.presentationExchange,
    ...resolved.dcql,
    origin,
    authorizationRequest: resolved.authorizationRequestPayload,
    formattedSubmission,
    transactionData: resolved.transactionData,
  } as const
}
