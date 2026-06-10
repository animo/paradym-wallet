import type { JwsSignerDid } from '@credo-ts/core'
import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type {
  DidTrustMechanismConfiguration,
  TrustedEntity,
  TrustedIssuerEntity,
  TrustedRelyingPartyEntity,
} from '../trustMechanism'

export type TrustedDidEntity = {
  did: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForDidForOpenId4VpOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustMechanismConfiguration: DidTrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export type GetTrustedEntitiesForDidForOpenId4VciOptions = {
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  trustMechanismConfiguration: DidTrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export const getTrustedEntitiesForDidForOpenId4Vp = async (
  options: GetTrustedEntitiesForDidForOpenId4VpOptions
): Promise<TrustedRelyingPartyEntity> => {
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

export const getTrustedEntitiesForDidForOpenId4Vci = (
  options: GetTrustedEntitiesForDidForOpenId4VciOptions
): TrustedIssuerEntity | undefined => {
  // Checked in the caller
  const signer = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.signer as JwsSignerDid
  // Strip fragment to get base DID (e.g. did:web:example.com#key-1 -> did:web:example.com)
  const baseDid = signer.didUrl.split('#')[0]
  const trustedEntity = options.trustMechanismConfiguration.trustedDidEntities.find((e) => baseDid.startsWith(e.did))
  if (trustedEntity) {
    // Prefer display data from the signed metadata over the hardcoded entity
    const metadataDisplay = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.jwt.payload.display?.[0]
    const organizationName = metadataDisplay?.name ?? trustedEntity.name
    const logoUri = metadataDisplay?.logo?.uri ?? trustedEntity.logoUri

    const trustedEntities: TrustedEntity[] = [
      {
        entityId: trustedEntity.entityId,
        organizationName,
        logoUri,
        uri: trustedEntity.url,
        demo: trustedEntity.demo,
      },
    ]
    if (options.walletTrustedEntity) trustedEntities.push(options.walletTrustedEntity)

    return {
      issuer: {
        organizationName,
        logoUri,
        uri: trustedEntity.url,
        entityId: trustedEntity.entityId,
      },
      trustedEntities,
    }
  }
}
