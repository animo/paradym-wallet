import { X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { t } from '@lingui/core/macro'
import type { TrustedEntity, TrustedX509Entity } from '@package/agent'
import type { EitherAgent } from '@package/agent'
import { commonMessages } from '@package/translations'
import { TRUSTED_ENTITIES } from '../invitation/trustedEntities'

export type TrustMechanism = 'eudi_rp_authentication' | 'openid_federation' | 'x509' | 'did' | 'none'

export type TrustList = TrustedEntity & {
  trustList: Array<TrustedEntity & { trustedRelyingPartyRegistrars: Array<TrustedEntity> }>
}

export type AuthorizationRequestVerificationResult = {
  isValidButUntrusted: boolean
  isValidAndTrusted: boolean
  x509RegistrationCertificate: X509Certificate
}[]

type GetTrustedEntitiesForEudiRpAuthenticationOptions = {
  authorizationRequestVerificationResult?: AuthorizationRequestVerificationResult
  trustedX509Entities: TrustedX509Entity[]
  trustList: TrustList
} & GetTrustedEntitiesForX509CertificateOptions

type GetTrustedEntitiesForOpenIdFederationOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  agent: EitherAgent
  origin?: string
} & GetTrustedEntitiesForX509CertificateOptions

type GetTrustedEntitiesForX509CertificateOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustedX509Entities: TrustedX509Entity[]
  agent: EitherAgent
  walletTrustedEntity?: TrustedEntity
}

type GetTrustedEntitiesForDidOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
}

export type GetTrustedEntitiesOptions = GetTrustedEntitiesForEudiRpAuthenticationOptions &
  GetTrustedEntitiesForOpenIdFederationOptions &
  GetTrustedEntitiesForDidOptions

export const detectTrustMechanism = (options: {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  authorizationRequestVerificationResult?: AuthorizationRequestVerificationResult
}): TrustMechanism => {
  const clientIdPrefix = options.resolvedAuthorizationRequest.verifier.clientIdPrefix

  if (options.authorizationRequestVerificationResult && options.authorizationRequestVerificationResult.length > 0) {
    return 'eudi_rp_authentication'
  }

  if (clientIdPrefix === 'origin' || clientIdPrefix === 'redirect_uri') {
    return 'none'
  }

  if (clientIdPrefix === 'openid_federation') {
    return 'openid_federation'
  }

  if (options.resolvedAuthorizationRequest.signedAuthorizationRequest?.signer.method === 'x5c') {
    return 'x509'
  }

  if (clientIdPrefix === 'decentralized_identifier') {
    return 'did'
  }

  throw new Error('Could not infer trust mechanism for authorization request')
}

export const getTrustedEntities = async (
  options: GetTrustedEntitiesOptions
): Promise<{
  trustMechanism: TrustMechanism
  relyingParty: { logoUri?: string; uri?: string; organizationName?: string; entityId: string }
  trustedEntities: Array<TrustedEntity>
}> => {
  const trustMechanism = detectTrustMechanism(options)

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let trustedEntities
  switch (trustMechanism) {
    case 'eudi_rp_authentication':
      trustedEntities = await getTrustedEntitiesForEudiRpAuthentication({ ...options, walletTrustedEntity: undefined })
      break
    case 'openid_federation':
      trustedEntities = await getTrustedEntitiesForOpenIdFederation({ ...options, walletTrustedEntity: undefined })
      break
    case 'x509':
      trustedEntities = await getTrustedEntitiesForX509Certificate(options)
      break
    case 'did':
      trustedEntities = await getTrustedEntitiesForDid(options)
      break
    case 'none': {
      const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
      const entityId = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_id
      const organizationName = clientMetadata?.client_name
      const logoUri = clientMetadata?.logo_uri

      trustedEntities = {
        relyingParty: {
          organizationName,
          logoUri,
          entityId,
        },
        trustedEntities: [],
      }
      break
    }
    default:
      throw new Error(`Could not handle trust mechanism: '${trustMechanism}'`)
  }

  let entityId = trustedEntities.relyingParty.entityId
  if (!entityId) {
    if (options.origin) entityId = `web-origin:${options.origin}`
    throw new Error('Missing required client_id in authorization request')
  }

  return {
    ...trustedEntities,
    trustMechanism,
    relyingParty: {
      ...trustedEntities.relyingParty,
      entityId,
    },
  }
}

const getTrustedEntitiesForEudiRpAuthentication = async (options: GetTrustedEntitiesForEudiRpAuthenticationOptions) => {
  const trustedEntities: TrustedEntity[] = []
  let organizationName: string | undefined
  let logoUri: string | undefined
  let uri: string | undefined
  let entityId: string | undefined

  // We can take the first entry as it only allows 1 entry for now
  // This is the certificate of the relying party
  const [entry] = options.authorizationRequestVerificationResult ?? []

  const matchedCert = options.trustedX509Entities.find(
    (t) => X509Certificate.fromEncodedCertificate(t.certificate).subject === entry.x509RegistrationCertificate.issuer
  )

  if (matchedCert) {
    const dnsName = entry.x509RegistrationCertificate.sanDnsNames[0]
    const uriName = entry.x509RegistrationCertificate.sanUriNames[0]

    organizationName = dnsName
    logoUri = matchedCert.logoUri
    uri = uriName
    entityId = dnsName

    // FIXME: why do we match the SAN dnsName of the registration certificate
    // to the entity-id of the trusted relying party? Shouldn't it be the IAN
    const country = options.trustList.trustList.find(({ trustedRelyingPartyRegistrars }) =>
      trustedRelyingPartyRegistrars.some((rpr) => rpr.entityId === dnsName)
    )

    if (country) {
      const registrar = country.trustedRelyingPartyRegistrars.find((rpr) => rpr.entityId === dnsName) as TrustedEntity
      trustedEntities.push(registrar)
      trustedEntities.push(country)
      trustedEntities.push(options.trustList)
    }
  }

  const { trustedEntities: x509TrustedEntities, relyingParty } = await getTrustedEntitiesForX509Certificate(options)

  return {
    relyingParty: {
      organizationName,
      logoUri,
      uri,
      entityId: entityId ?? relyingParty.entityId,
    },
    trustedEntities: [...x509TrustedEntities, ...trustedEntities],
  }
}

const getTrustedEntitiesForOpenIdFederation = async (options: GetTrustedEntitiesForOpenIdFederationOptions) => {
  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
  const entityId = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_id
  const organizationName = clientMetadata?.client_name
  const logoUri = clientMetadata?.logo_uri

  const resolvedChains = entityId
    ? await options.agent.modules.openid4vc.holder.resolveOpenIdFederationChains({
        entityId,
        trustAnchorEntityIds: TRUSTED_ENTITIES,
      })
    : undefined

  const uri =
    typeof options.resolvedAuthorizationRequest.authorizationRequestPayload.response_uri === 'string'
      ? new URL(options.resolvedAuthorizationRequest.authorizationRequestPayload.response_uri).origin
      : undefined

  const trustedEntities =
    resolvedChains
      ?.map((chain) => ({
        entityId: chain.trustAnchorEntityConfiguration.sub,
        organizationName:
          chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.organization_name ??
          t(commonMessages.unknownOrganization),
        logoUri: chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.logo_uri,
      }))
      .filter((entity, index, self) => self.findIndex((e) => e.entityId === entity.entityId) === index) ?? []

  return {
    relyingParty: {
      organizationName,
      logoUri,
      entityId,
      uri,
    },
    trustedEntities,
  }
}

const getTrustedEntitiesForDid = async (options: GetTrustedEntitiesForDidOptions) => {
  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
  const entityId = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_id
  const organizationName = clientMetadata?.client_name
  const logoUri = clientMetadata?.logo_uri

  return {
    relyingParty: {
      organizationName,
      logoUri,
      entityId,
    },
    trustedEntities: [],
  }
}

const getTrustedEntitiesForX509Certificate = async ({
  resolvedAuthorizationRequest,
  agent,
  trustedX509Entities,
  walletTrustedEntity,
}: GetTrustedEntitiesForX509CertificateOptions) => {
  const trustedEntities: TrustedEntity[] = []
  let organizationName: string | undefined
  let logoUri: string | undefined
  const uri =
    typeof resolvedAuthorizationRequest.authorizationRequestPayload.response_uri === 'string'
      ? new URL(resolvedAuthorizationRequest.authorizationRequestPayload.response_uri).origin
      : undefined
  let entityId = resolvedAuthorizationRequest.authorizationRequestPayload.client_id

  const x509Config = agent.dependencyManager.resolve(X509ModuleConfig)
  const signer = resolvedAuthorizationRequest.signedAuthorizationRequest?.signer

  try {
    if (signer && signer.method === 'x5c') {
      // FIXME: we should return the x509 cert that was matched, then we can just see if it's in
      // the list of hardcoded trusted certificates
      const chain = await agent.x509
        .validateCertificateChain({
          certificateChain: signer.x5c,
          certificate: signer.x5c[0],
          trustedCertificates: x509Config.trustedCertificates,
        })
        .catch(() => null)

      const trustedEntity = chain
        ? trustedX509Entities?.find((e) => X509Certificate.fromEncodedCertificate(e.certificate).equal(chain[0]))
        : null
      if (trustedEntity) {
        organizationName = trustedEntity.name
        logoUri = trustedEntity.logoUri
        entityId = trustedEntity.entityId

        trustedEntities.push({
          entityId: trustedEntity.entityId,
          organizationName: trustedEntity.name,
          logoUri: trustedEntity.logoUri,
          uri: trustedEntity.url,
          demo: trustedEntity.demo,
        })

        if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)
      } else {
        organizationName = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata?.client_name
        logoUri = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata?.logo_uri
      }
    }
  } catch (error) {
    // no-op
  }

  return {
    relyingParty: {
      organizationName,
      logoUri,
      uri,
      entityId,
    },
    trustedEntities,
  }
}
