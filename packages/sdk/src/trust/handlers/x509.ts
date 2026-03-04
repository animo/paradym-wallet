import { X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type { TrustedEntity, X509TrustMechanismConfiguration } from '../trustMechanism'

export type TrustedX509Entity = {
  certificate: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForX509CertificateOptions = {
  paradym: ParadymWalletSdk
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustMechanismConfiguration: X509TrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export const getTrustedEntitiesForX509Certificate = async ({
  resolvedAuthorizationRequest,
  paradym,
  walletTrustedEntity,
  trustMechanismConfiguration,
}: GetTrustedEntitiesForX509CertificateOptions) => {
  const trustedEntities: TrustedEntity[] = []
  let organizationName: string | undefined
  let logoUri: string | undefined
  const uri =
    typeof resolvedAuthorizationRequest.authorizationRequestPayload.response_uri === 'string'
      ? new URL(resolvedAuthorizationRequest.authorizationRequestPayload.response_uri).origin
      : undefined
  let entityId = resolvedAuthorizationRequest.authorizationRequestPayload.client_id

  const x509Config = paradym.agent.dependencyManager.resolve(X509ModuleConfig)
  const signer = resolvedAuthorizationRequest.signedAuthorizationRequest?.signer

  try {
    if (signer && signer.method === 'x5c') {
      // FIXME: we should return the x509 cert that was matched, then we can just see if it's in
      // the list of hardcoded trusted certificates
      const chain = await paradym.agent.x509
        .validateCertificateChain({
          certificateChain: signer.x5c,
          certificate: signer.x5c[0],
          trustedCertificates: x509Config.trustedCertificates,
        })
        .catch(() => null)

      const trustedEntity = chain
        ? trustMechanismConfiguration.trustedX509Entities.find((e) =>
            X509Certificate.fromEncodedCertificate(e.certificate).equal(chain[0])
          )
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
