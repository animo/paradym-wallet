import { type AgentContext, JwsService, TypedArrayEncoder } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { getAccessCertificateSubjectIdentifier, parseAccessCertificate } from '@owf/eudi-access-certificate'
import {
  checkOverAsking,
  decodeWRPRC,
  type OverAskingResult,
  type RegisteredCredential,
} from '@owf/eudi-registration-certificate'
import { getTrustedList, type TrustedListConfiguration } from './trustedLists'

/**
 *
 * Check whether a request asks for credentials or claims beyond the registration certificate
 * (ETSI TS 119 475) it carries. Without a registration certificate that is signed by a provider on
 * the lists of registration certificate providers, unexpired and bound to the access certificate the
 * request is signed with, nothing is registered. `undefined` when no such lists are configured.
 *
 */
export const checkRequestForOverAsking = async (
  agentContext: AgentContext,
  trustedLists: TrustedListConfiguration[],
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
): Promise<OverAskingResult | undefined> => {
  if (trustedLists.length === 0) return undefined

  const { verifier_info, dcql_query } = resolvedAuthorizationRequest.authorizationRequestPayload
  // ETSI TS 119 472-2 OIDFVP-HAIP-COMMON-REQ-RO-15
  const data = verifier_info?.find(({ format }) => format === 'registration_cert')?.data

  const registeredCredentials =
    typeof data === 'string'
      ? await getRegisteredCredentials(agentContext, trustedLists, resolvedAuthorizationRequest, data).catch(
          (error) => {
            agentContext.config.logger.warn('Could not verify the registration certificate', { error })
            return []
          }
        )
      : []

  return checkOverAsking(dcql_query, registeredCredentials)
}

const getRegisteredCredentials = async (
  agentContext: AgentContext,
  trustedLists: TrustedListConfiguration[],
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest,
  data: string
): Promise<RegisteredCredential[]> => {
  const signer = resolvedAuthorizationRequest.signedAuthorizationRequest?.signer
  if (signer?.method !== 'x5c') throw new Error('The request is not signed with an access certificate')

  const loadedLists = await Promise.all(
    trustedLists.map((config) => getTrustedList(agentContext, config, 'registrationCertificate'))
  )
  const trustedCertificates = loadedLists.flatMap(
    (trustedList) => trustedList?.providers.flatMap(({ certificates }) => certificates) ?? []
  )
  if (trustedCertificates.length === 0) throw new Error('No registration certificate providers are loaded')

  // ETSI TS 119 472-2 asks for the base64url encoding of the compact JWS, which is base64url already
  const jws = data.includes('.') ? data : TypedArrayEncoder.toUtf8String(TypedArrayEncoder.fromBase64Url(data))

  // Validates the chain up to a listed provider, revocation included
  const { isValid } = await agentContext.dependencyManager.resolve(JwsService).verifyJws(agentContext, {
    jws,
    allowedJwsSignerMethods: ['x5c'],
    trustedCertificates,
  })
  if (!isValid) throw new Error('The signature of the registration certificate is invalid')

  const accessCertificateSub = getAccessCertificateSubjectIdentifier(parseAccessCertificate(signer.x5c[0]))
  if (!accessCertificateSub) throw new Error('The access certificate has no semantic identifier')

  // Checks it follows ETSI TS 119 475 and is bound to the access certificate
  const { payload } = decodeWRPRC(jws, accessCertificateSub)
  if (payload.exp !== undefined && payload.exp * 1000 <= Date.now()) {
    throw new Error('The registration certificate has expired')
  }

  // shortcut: the status list of the registration certificate is not checked, so a revoked one still counts
  return payload.credentials ?? []
}
