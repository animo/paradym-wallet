import { X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type {
  EitherAgent,
  TrustedDidEntity,
  TrustedEntity,
  TrustedOpenId4VciIssuerEntity,
  TrustedX509Entity,
} from '@package/agent'

type SignedCredentialIssuer = NonNullable<OpenId4VciResolvedCredentialOffer['metadata']['signedCredentialIssuer']>

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
  trustedDidEntities: TrustedDidEntity[]
  walletTrustedEntity?: TrustedEntity
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

  // biome-ignore lint/suspicious/noImplicitAnyLet: no explanation
  let trustedEntities
  switch (trustMechanism) {
    case 'eudi_rp_authentication':
      trustedEntities = await getTrustedEntitiesForEudiRpAuthentication({ ...options, walletTrustedEntity: undefined })
      break
    // NOTE: add back when enabling federation support
    // case 'openid_federation':
    //   trustedEntities = await getTrustedEntitiesForOpenIdFederation({ ...options, walletTrustedEntity: undefined })
    //   break
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

  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata

  const matchedCert = options.trustedX509Entities.find(
    (t) => X509Certificate.fromEncodedCertificate(t.certificate).subject === entry.x509RegistrationCertificate.issuer
  )

  if (matchedCert) {
    const dnsName = entry.x509RegistrationCertificate.sanDnsNames[0]
    const uriName = entry.x509RegistrationCertificate.sanUriNames[0]

    // Prefer metadata from the request over the hardcoded entity data
    organizationName = clientMetadata?.client_name ?? dnsName
    logoUri = clientMetadata?.logo_uri ?? matchedCert.logoUri
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

// NOTE: add back when enabling federation support
// const getTrustedEntitiesForOpenIdFederation = async (options: GetTrustedEntitiesForOpenIdFederationOptions) => {
//   const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
//   const entityId = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_id
//   const organizationName = clientMetadata?.client_name
//   const logoUri = clientMetadata?.logo_uri

//   const resolvedChains = entityId
//     ? await options.agent.openid4vc.holder.resolveOpenIdFederationChains({
//         entityId,
//         trustAnchorEntityIds: TRUSTED_ENTITIES,
//       })
//     : undefined

//   const uri =
//     typeof options.resolvedAuthorizationRequest.authorizationRequestPayload.response_uri === 'string'
//       ? new URL(options.resolvedAuthorizationRequest.authorizationRequestPayload.response_uri).origin
//       : undefined

//   const trustedEntities =
//     resolvedChains
//       ?.map((chain) => ({
//         entityId: chain.trustAnchorEntityConfiguration.sub,
//         organizationName:
//           chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.organization_name ??
//           t(commonMessages.unknownOrganization),
//         logoUri: chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.logo_uri,
//       }))
//       .filter((entity, index, self) => self.findIndex((e) => e.entityId === entity.entityId) === index) ?? []

//   return {
//     relyingParty: {
//       organizationName,
//       logoUri,
//       entityId,
//       uri,
//     },
//     trustedEntities,
//   }
// }

const getTrustedEntitiesForDid = async (options: GetTrustedEntitiesForDidOptions) => {
  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
  const effectiveClientId = options.resolvedAuthorizationRequest.verifier.effectiveClientId
  const trustedEntities: TrustedEntity[] = []

  // Check if the DID matches a hardcoded trusted entity
  const matchedDid = effectiveClientId
    ? options.trustedDidEntities.find((e) => effectiveClientId === `decentralized_identifier:${e.did}`)
    : undefined

  // Prefer metadata from the request over the hardcoded entity data
  const organizationName = clientMetadata?.client_name ?? matchedDid?.name
  const logoUri = clientMetadata?.logo_uri ?? matchedDid?.logoUri

  if (matchedDid) {
    trustedEntities.push({
      entityId: matchedDid.entityId,
      organizationName: matchedDid.name,
      logoUri: matchedDid.logoUri,
      uri: matchedDid.url,
      demo: matchedDid.demo,
    })

    if (options.walletTrustedEntity) trustedEntities.push(options.walletTrustedEntity)
  }

  return {
    relyingParty: {
      organizationName,
      logoUri,
      entityId: effectiveClientId.replace('decentralized_identifier:', ''),
    },
    trustedEntities,
  }
}

/**
 * Match a JWT signer (from signed OID4VCI metadata or OID4VP request) to a trusted entity.
 * Returns the matched trusted entity data, or null if no match found.
 */
const matchSignerToTrustedEntity = async ({
  signer,
  agent,
  trustedX509Entities,
  trustedDidEntities,
}: {
  signer: { method: string; x5c?: string[]; didUrl?: string }
  agent: EitherAgent
  trustedX509Entities: TrustedX509Entity[]
  trustedDidEntities: TrustedDidEntity[]
}): Promise<{ entity: TrustedX509Entity | TrustedDidEntity; method: 'x509' | 'did' } | null> => {
  if (signer.method === 'x5c' && signer.x5c) {
    const x509Config = agent.dependencyManager.resolve(X509ModuleConfig)
    try {
      const chain = await agent.x509
        .validateCertificateChain({
          certificateChain: signer.x5c,
          certificate: signer.x5c[0],
          trustedCertificates: x509Config.trustedCertificates,
        })
        .catch(() => null)

      const trustedEntity = chain
        ? trustedX509Entities.find((e) => X509Certificate.fromEncodedCertificate(e.certificate).equal(chain[0]))
        : null

      if (trustedEntity) return { entity: trustedEntity, method: 'x509' }
    } catch {
      // no-op
    }
  }

  if (signer.method === 'did' && signer.didUrl) {
    // Strip fragment to get base DID (e.g. did:web:example.com#key-1 -> did:web:example.com)
    const baseDid = signer.didUrl.split('#')[0]
    const trustedEntity = trustedDidEntities.find((e) => baseDid.startsWith(e.did))
    if (trustedEntity) return { entity: trustedEntity, method: 'did' }
  }

  return null
}

/**
 * Resolve trust information for an OID4VCI credential offer based on signed issuer metadata.
 * Falls back to matching against trusted issuer entities by issuer URL if no signed metadata match is found.
 */
export const getTrustedEntitiesForOid4vci = async ({
  signedCredentialIssuer,
  issuer,
  agent,
  trustedX509Entities,
  trustedDidEntities,
  trustedOpenId4VciIssuerEntities = [],
  walletTrustedEntity,
}: {
  signedCredentialIssuer?: SignedCredentialIssuer
  issuer?: string
  agent: EitherAgent
  trustedX509Entities: TrustedX509Entity[]
  trustedDidEntities: TrustedDidEntity[]
  trustedOpenId4VciIssuerEntities?: TrustedOpenId4VciIssuerEntity[]
  walletTrustedEntity?: TrustedEntity
}): Promise<{
  trustedEntities: TrustedEntity[]
  trustMechanism: TrustMechanism
}> => {
  if (signedCredentialIssuer) {
    const { signer } = signedCredentialIssuer
    const match = await matchSignerToTrustedEntity({ signer, agent, trustedX509Entities, trustedDidEntities })

    if (match) {
      const { entity, method } = match

      // Prefer display data from the signed metadata over the hardcoded entity
      const metadataDisplay = signedCredentialIssuer.jwt.payload.display?.[0]
      const organizationName = metadataDisplay?.name ?? entity.name
      const logoUri = metadataDisplay?.logo?.uri ?? entity.logoUri

      const trustedEntities: TrustedEntity[] = [
        {
          entityId: entity.entityId,
          organizationName,
          logoUri,
          uri: entity.url,
          demo: entity.demo,
        },
      ]
      if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)

      return { trustedEntities, trustMechanism: method }
    }
  }

  // Fall back to matching by issuer URL if no signed metadata match was found
  if (issuer) {
    const matchedIssuer = trustedOpenId4VciIssuerEntities.find((e) => issuer.startsWith(e.issuer))
    if (matchedIssuer) {
      const trustedEntities: TrustedEntity[] = [
        {
          entityId: matchedIssuer.entityId,
          organizationName: matchedIssuer.name,
          logoUri: matchedIssuer.logoUri,
          uri: matchedIssuer.url,
          demo: matchedIssuer.demo,
        },
      ]
      if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)

      return { trustedEntities, trustMechanism: 'none' }
    }
  }

  if (!signedCredentialIssuer) {
    return { trustedEntities: [], trustMechanism: 'none' }
  }

  const { signer } = signedCredentialIssuer
  return {
    trustedEntities: [],
    trustMechanism: signer.method === 'x5c' ? 'x509' : signer.method === 'did' ? 'did' : 'none',
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
        const clientMetadata = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
        // Prefer metadata from the request over the hardcoded entity data
        organizationName = clientMetadata?.client_name ?? trustedEntity.name
        logoUri = clientMetadata?.logo_uri ?? trustedEntity.logoUri
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
  } catch (_error) {
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
