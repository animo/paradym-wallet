import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import { type DifPresentationExchangeDefinitionV2, Jwt, X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { assertAgentType } from '../../agent'
import { ParadymWalletNoRequestToResolveError } from '../../error'
import { formatDifPexCredentialsForRequest } from '../../format/presentationExchangeRequest'
import type { FormattedSubmission } from '../../format/submission'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import { getTrustedEntities } from '../../trust/trustMechanism'
import { getEudiDcqlVerifierAttestationRequest, resolveEudiDcqlCredentialRequest } from '../dcql/eudiDcql'

export type ResolveCredentialRequestOptions = {
  paradym: ParadymWalletSdk
  requestPayload?: Record<string, unknown>
  uri?: string
  origin?: string
}

const shouldBypassVerifierAttestationVerification = async ({
  paradym,
  resolvedAuthorizationRequest,
}: {
  paradym: ParadymWalletSdk
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
}) => {
  const [verifierAttestation] = resolvedAuthorizationRequest.authorizationRequestPayload.verifier_attestations ?? []
  if (verifierAttestation?.format !== 'jwt' || typeof verifierAttestation.data !== 'string') return undefined

  const jwt = Jwt.fromSerializedJwt(verifierAttestation.data)
  if (!jwt.header.x5c?.length) return undefined

  return !!(await paradym.agent.dependencyManager
    .resolve(X509ModuleConfig)
    .getTrustedCertificatesForVerification?.(paradym.agent.context, {
      certificateChain: jwt.header.x5c.map((certificate) => X509Certificate.fromEncodedCertificate(certificate)),
      verification: {
        type: 'oauth2SecuredAuthorizationRequest',
        authorizationRequest: {
          jwt: verifierAttestation.data,
          payload: jwt.payload,
        },
      },
    }))
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

    const eudiResolved = await resolveEudiDcqlCredentialRequest({ paradym, requestToResolve, origin })
    const resolved =
      eudiResolved ??
      (await paradym.agent.openid4vc.holder.resolveOpenId4VpAuthorizationRequest(requestToResolve, {
        origin,
        // NOTE: add back when enabling federation support
        // trustedFederationEntityIds: paradym.trustMechanisms.find((tm) => tm.trustMechanism === 'openid_federation')
        // ?.trustedEntityIds,
      }))

    if (resolved.dcql && !eudiResolved) {
      throw new Error('Unexpected Credo DCQL resolution path')
    }

    const verificationRequest = getEudiDcqlVerifierAttestationRequest(resolved)

    const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(paradym.agent.context, {
      resolvedAuthorizationRequest: verificationRequest,
      allowUntrustedSigned: await shouldBypassVerifierAttestationVerification({
        paradym,
        resolvedAuthorizationRequest: verificationRequest,
      }),
    })

    const { trustMechanism, trustedEntities, relyingParty } = await getTrustedEntities({
      paradym,
      resolvedAuthorizationRequest: verificationRequest,
      authorizationRequestVerificationResult,
    })

    let formattedSubmission: FormattedSubmission
    if (eudiResolved) {
      formattedSubmission = eudiResolved.formattedSubmission
    } else if (resolved.presentationExchange) {
      formattedSubmission = formatDifPexCredentialsForRequest(
        resolved.presentationExchange.credentialsForRequest,
        resolved.presentationExchange.definition as DifPresentationExchangeDefinitionV2
      )
    } else {
      throw new Error('No presentation exchange or dcql found in authorization request.')
    }

    return {
      ...resolved.presentationExchange,
      ...(eudiResolved ? { eudiDcql: eudiResolved.eudiDcql } : {}),
      ...(eudiResolved?.authorizationRequestIntegrity
        ? { authorizationRequestIntegrity: eudiResolved.authorizationRequestIntegrity }
        : {}),
      signedAuthorizationRequest: resolved.signedAuthorizationRequest,
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

export type CredentialsForProofRequest = Awaited<ReturnType<typeof resolveCredentialRequest>>
