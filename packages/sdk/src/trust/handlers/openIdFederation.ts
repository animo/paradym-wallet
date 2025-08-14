import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '@paradym/wallet-sdk/ParadymWalletSdk'
import type { GetTrustedEntitiesForX509CertificateOptions } from './x509'

export type GetTrustedEntitiesForOpenIdFederationOptions = {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  paradym: ParadymWalletSdk
  origin?: string
  trustedEntityIds: string[]
} & GetTrustedEntitiesForX509CertificateOptions

export const getTrustedEntitiesForOpenIdFederation = async (options: GetTrustedEntitiesForOpenIdFederationOptions) => {
  const clientMetadata = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
  const entityId = options.resolvedAuthorizationRequest.authorizationRequestPayload.client_id
  const organizationName = clientMetadata?.client_name
  const logoUri = clientMetadata?.logo_uri

  const resolvedChains = entityId
    ? await options.paradym.agent.modules.openId4VcHolder.resolveOpenIdFederationChains({
        entityId,
        trustAnchorEntityIds: options.trustedEntityIds as [string, ...string[]],
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
          chain.trustAnchorEntityConfiguration.metadata?.federation_entity?.organization_name ?? 'Unknown organization',
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
