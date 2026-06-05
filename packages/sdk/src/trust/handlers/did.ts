import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { DidTrustMechanismConfiguration, TrustedEntity } from '../trustMechanism'

export type TrustedDidEntity = {
  did: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForDidOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  walletTrustedEntity?: TrustedEntity
  trustMechanismConfiguration: DidTrustMechanismConfiguration
}

export const getTrustedEntitiesForDid = async (options: GetTrustedEntitiesForDidOptions) => {
  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
  const effectiveClientId = options.resolvedAuthorizationRequest.verifier.effectiveClientId
  const trustedEntities: TrustedEntity[] = []

  // Check if the DID matches a hardcoded trusted entity
  const matchedDid = effectiveClientId
    ? options.trustMechanismConfiguration.trustedDidEntities.find(
        (e) => effectiveClientId === `decentralized_identifier:${e.did}`
      )
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
