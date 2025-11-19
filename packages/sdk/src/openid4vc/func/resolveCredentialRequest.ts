import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import type { DifPresentationExchangeDefinitionV2 } from '@credo-ts/core'
import { ParadymWalletNoRequestToResolveError } from '@paradym/wallet-sdk/error'
import { formatDcqlCredentialsForRequest } from '@paradym/wallet-sdk/format/dcqlRequest'
import { formatDifPexCredentialsForRequest } from '@paradym/wallet-sdk/format/presentationExchangeRequest'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'
import { getTrustedEntities } from '@paradym/wallet-sdk/trust/trustMechanism'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'

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

    // TODO(sdk): will this still work if no eudi is used?
    const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(paradym.agent.context, {
      resolvedAuthorizationRequest: resolved,
      allowUntrustedSigned: allowUntrusted,
    })

    const { trustMechanism, trustedEntities, relyingParty } = await getTrustedEntities({
      paradym,
      resolvedAuthorizationRequest: resolved,
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
    }
  } catch (error) {
    paradym.logger.error('Error getting credentials for request', {
      error,
    })

    throw error
  }
}
