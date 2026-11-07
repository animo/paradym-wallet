import { type AgentContext, JwsService, TypedArrayEncoder } from '@credo-ts/core'
import type {
  OpenId4VciCredentialConfigurationSupportedWithFormats,
  OpenId4VciResolvedCredentialOffer,
  OpenId4VpResolvedAuthorizationRequest,
} from '@credo-ts/openid4vc'
import { getAccessCertificateSubjectIdentifier, parseAccessCertificate } from '@owf/eudi-access-certificate'
import {
  checkOverAsking,
  decodeWRPRC,
  hasAttestationProviderEntitlement,
  type OverAskingResult,
  type WRPRCPayload,
} from '@owf/eudi-registration-certificate'
import { getTrustedList, type TrustedListConfiguration } from './trustedLists'

/**
 *
 * Check whether a request asks for credentials or claims beyond the registration certificate
 * (ETSI TS 119 475) it carries. Without a registration certificate that is signed by a provider on
 * the lists of registration certificate providers, unexpired and bound to the access certificate the
 * request is signed with, nothing is registered. `undefined` when no such lists are configured, or
 * when one isn't loaded and the registration certificate can't be verified.
 *
 */
export const checkRequestForOverAsking = async (
  agentContext: AgentContext,
  trustedLists: TrustedListConfiguration[],
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest,
  accessCertificate: string
): Promise<OverAskingResult | undefined> => {
  if (trustedLists.length === 0) return undefined

  const { verifier_info, dcql_query } = resolvedAuthorizationRequest.authorizationRequestPayload
  // ETSI TS 119 472-2 OIDFVP-HAIP-COMMON-REQ-RO-15
  const data = verifier_info?.find(({ format }) => format === 'registration_cert')?.data
  if (typeof data !== 'string') return checkOverAsking(dcql_query, [])

  const providers = await loadRegistrationCertificateProviders(agentContext, trustedLists)
  const payload = await verifyRegistrationCertificate(
    agentContext,
    providers.trustedCertificates,
    accessCertificate,
    data
  )
  if (payload) return checkOverAsking(dcql_query, payload.credentials ?? [])

  // The provider may be on a list the wallet couldn't load, so whether the party over-asks is unknown
  return providers.isEveryListLoaded ? checkOverAsking(dcql_query, []) : undefined
}

/**
 *
 * Check whether an issuer offers credentials beyond the registration certificates (ETSI TS 119 475)
 * in the `issuer_info` of its signed metadata (ETSI TS 119 472-3). Each offered credential is checked
 * against the registration certificates relevant to it by `credential_ids`. A registration certificate
 * that isn't signed by a provider on the lists of registration certificate providers, is expired, isn't
 * bound to the access certificate the metadata is signed with, or isn't for an attestation provider,
 * registers nothing. `undefined` when no such lists are configured, when the metadata carries no registration
 * certificate, which is optional for an issuer, or when a list isn't loaded and a relevant
 * registration certificate can't be verified.
 *
 */
export const checkOfferForRegistration = async (
  agentContext: AgentContext,
  trustedLists: TrustedListConfiguration[],
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer,
  accessCertificate: string
): Promise<OverAskingResult | undefined> => {
  if (trustedLists.length === 0) return undefined

  // ETSI TS 119 472-3 ISS-MDATA-REG_CERT-4.2.3-02 and 4.2.3-05, from the signed metadata only
  const registrationCertificates =
    resolvedCredentialOffer.metadata.signedCredentialIssuer?.jwt.payload.issuer_info?.filter(
      ({ format }) => format === 'registration_cert'
    ) ?? []
  if (registrationCertificates.length === 0) return undefined

  const offeredCredentials = Object.entries(resolvedCredentialOffer.offeredCredentialConfigurations)
  // As in `verifier_info` of OpenID4VP, an entry without `credential_ids` is relevant to every credential
  const isRelevant = ({ credential_ids }: (typeof registrationCertificates)[number], id: string) =>
    !credential_ids || credential_ids.includes(id)

  // Only the registration certificates relevant to the offer are verified, each once
  const providers = await loadRegistrationCertificateProviders(agentContext, trustedLists)
  const payloads = await Promise.all(
    registrationCertificates.map((registrationCertificate) =>
      typeof registrationCertificate.data === 'string' &&
      offeredCredentials.some(([id]) => isRelevant(registrationCertificate, id))
        ? verifyRegistrationCertificate(
            agentContext,
            providers.trustedCertificates,
            accessCertificate,
            registrationCertificate.data
          )
        : undefined
    )
  )

  // Each offered credential has to be registered by a registration certificate relevant to it
  const results = offeredCredentials.map(([id, configuration], index) => {
    const relevantPayloads = registrationCertificates.flatMap((registrationCertificate, i) =>
      isRelevant(registrationCertificate, id) ? [payloads[i]] : []
    )
    // `provides_attestations` registers credentials as DCQL does, so the offered credential is checked as a query for it
    const result = checkOverAsking(
      { credentials: [{ id, format: configuration.format, meta: getCredentialMeta(configuration) }] },
      relevantPayloads.flatMap((payload) =>
        payload && hasAttestationProviderEntitlement(payload.entitlements) ? (payload.provides_attestations ?? []) : []
      )
    )

    // A registration certificate that couldn't be verified may be from a provider on a list the wallet couldn't load
    if (!result.valid && !providers.isEveryListLoaded && relevantPayloads.some((payload) => !payload)) return undefined
    return {
      valid: result.valid,
      issues: result.issues.map((issue) => ({ ...issue, path: ['credentials', index, ...issue.path.slice(2)] })),
    }
  })

  if (results.includes(undefined) && results.every((result) => result?.valid !== false)) return undefined
  return {
    valid: results.every((result) => result?.valid),
    issues: results.flatMap((result) => result?.issues ?? []),
  }
}

// The DCQL `meta` of an offered credential
const getCredentialMeta = (configuration: OpenId4VciCredentialConfigurationSupportedWithFormats) => {
  if ('vct' in configuration && typeof configuration.vct === 'string') return { vct_values: [configuration.vct] }
  if ('doctype' in configuration) return { doctype_value: configuration.doctype }
  if (
    configuration.format === 'jwt_vc_json' ||
    configuration.format === 'jwt_vc_json-ld' ||
    configuration.format === 'ldp_vc'
  ) {
    return { type_values: [configuration.credential_definition.type] }
  }
  return {}
}

const loadRegistrationCertificateProviders = async (
  agentContext: AgentContext,
  trustedLists: TrustedListConfiguration[]
) => {
  const loadedLists = await Promise.all(
    trustedLists.map((config) => getTrustedList(agentContext, config, 'registrationCertificate'))
  )

  return {
    trustedCertificates: loadedLists.flatMap(
      (trustedList) => trustedList?.providers.flatMap(({ certificates }) => certificates) ?? []
    ),
    isEveryListLoaded: loadedLists.every(Boolean),
  }
}

/**
 *
 * The payload of a registration certificate that is signed by a provider on the lists, bound to the
 * access certificate and unexpired, or `undefined` when it isn't.
 *
 */
const verifyRegistrationCertificate = async (
  agentContext: AgentContext,
  trustedCertificates: string[],
  accessCertificate: string,
  data: string
): Promise<WRPRCPayload | undefined> => {
  try {
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

    const accessCertificateSub = getAccessCertificateSubjectIdentifier(parseAccessCertificate(accessCertificate))
    if (!accessCertificateSub) throw new Error('The access certificate has no semantic identifier')

    // Checks it follows ETSI TS 119 475 and is bound to the access certificate
    const { payload } = decodeWRPRC(jws, accessCertificateSub)
    if (payload.exp !== undefined && payload.exp * 1000 <= Date.now()) {
      throw new Error('The registration certificate has expired')
    }

    // shortcut: the status list of the registration certificate is not checked, so a revoked one still counts
    return payload
  } catch (error) {
    agentContext.config.logger.warn('Could not verify the registration certificate', { error })
    return undefined
  }
}
