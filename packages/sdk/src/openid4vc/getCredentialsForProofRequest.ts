import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import { type DifPresentationExchangeDefinitionV2, Jwt } from '@credo-ts/core'
import { getOpenid4vpClientId } from '@openid4vc/openid4vp'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'
import { ParadymWalletNoRequestToResolveError } from '../error'
import { formatDcqlCredentialsForRequest } from '../format/dcqlRequest'
import { formatDifPexCredentialsForRequest } from '../format/presentationExchangeRequest'
import type { FormattedSubmission } from '../format/submission'
import { getTrustedEntities } from '../trust/trustMechanism'

export type GetCredentialsForProofRequestOptions = {
  paradym: ParadymWalletSdk
  requestPayload?: Record<string, unknown>
  uri?: string
  allowUntrusted?: boolean
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
  paradym,
  uri,
  allowUntrusted = true,
  requestPayload,
  origin,
}: GetCredentialsForProofRequestOptions) => {
  const requestToResolve = uri ?? requestPayload

  if (!requestToResolve) {
    throw new ParadymWalletNoRequestToResolveError(
      'Either supply a uri or requestPayload to get the credentials for a proof request'
    )
  }

  const resolved = await paradym.agent.modules.openId4VcHolder.resolveOpenId4VpAuthorizationRequest(requestToResolve, {
    origin,
    trustedFederationEntityIds: paradym.trustMechanisms.find((tm) => tm.trustMechanism === 'openid_federation')
      ?.trustedEntityIds,
  })

  // TODO(sdk): will this still work if no eudi is used?
  const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(paradym.agent.context, {
    resolvedAuthorizationRequest: resolved,
    allowUntrustedSigned: allowUntrusted,
  })

  // TODO(sdk): wallet trusted entity, how to manage this?
  const { trustMechanism, trustedEntities, relyingParty } = await getTrustedEntities({
    paradym,
    resolvedAuthorizationRequest: resolved,
    origin,
    authorizationRequestVerificationResult,
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
    trustMechanism,
    verifier: {
      hostName: relyingParty.uri,
      entityId: relyingParty.entityId,
      logo: relyingParty.logoUri
        ? {
            url: relyingParty.logoUri,
          }
        : undefined,
      name: relyingParty.organizationName,
      trustedEntities,
    },
  } as const
}

export type CredentialsForProofRequest = Awaited<ReturnType<typeof getCredentialsForProofRequest>>
