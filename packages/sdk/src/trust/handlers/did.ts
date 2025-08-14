import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'

export type GetTrustedEntitiesForDidOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
}

export const getTrustedEntitiesForDid = async (options: GetTrustedEntitiesForDidOptions) => {
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
