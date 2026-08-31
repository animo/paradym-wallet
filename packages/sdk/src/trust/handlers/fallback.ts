import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type {
  FallbackMechanismConfiguration,
  TrustedEntity,
  TrustedIssuerEntity,
  TrustedRelyingPartyEntity,
} from '../trustMechanism'

export type TrustedOpenId4VciEntity = {
  issuer: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForFallbackForOpenId4VpOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  walletTrustedEntity?: TrustedEntity
}

export type GetTrustedEntitiesForFallbackForOpenId4VciOptions = {
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  trustMechanismConfiguration: FallbackMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export const getTrustedEntitiesForFallbackForOpenId4Vp = async (
  options: GetTrustedEntitiesForFallbackForOpenId4VpOptions
): Promise<TrustedRelyingPartyEntity> => {
  const { authorizationRequestPayload, origin } = options.resolvedAuthorizationRequest
  const clientMetadata = authorizationRequestPayload.client_metadata
  // An unsigned request over the digital credentials API carries no client_id: the verifier is
  // identified by the origin the OS reported, which is what credo resolved the client from.
  const entityId = authorizationRequestPayload.client_id ?? origin
  const organizationName = clientMetadata?.client_name
  const logoUri = clientMetadata?.logo_uri

  return {
    relyingParty: {
      organizationName,
      logoUri,
      entityId,
      uri: origin,
    },
    // Nothing established who this is — not even the wallet itself, which is only a trusted entity
    // alongside an approval the other mechanisms actually found. Listing it here would make an
    // unverified verifier read as approved.
    trustedEntities: [],
  }
}

export const getTrustedEntitiesForFallbackForOpenId4Vci = async (
  options: GetTrustedEntitiesForFallbackForOpenId4VciOptions
): Promise<TrustedIssuerEntity | undefined> => {
  const issuer = options.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer
  const trustedEntity = options.trustMechanismConfiguration.trustedEntities.find((e) => issuer.startsWith(e.issuer))
  if (trustedEntity) {
    const trustedEntities: TrustedEntity[] = [
      {
        entityId: trustedEntity.entityId,
        organizationName: trustedEntity.name,
        logoUri: trustedEntity.logoUri,
        uri: trustedEntity.url,
        demo: trustedEntity.demo,
      },
    ]
    if (options.walletTrustedEntity) trustedEntities.push(options.walletTrustedEntity)

    const metadataDisplay = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.jwt.payload.display?.[0]
    const organizationName = metadataDisplay?.name ?? trustedEntity.name
    const logoUri = metadataDisplay?.logo?.uri ?? trustedEntity.logoUri

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
