import { type JwsSignerX5c, X509Certificate, X509ModuleConfig } from '@credo-ts/core'
import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type {
  TrustedEntity,
  TrustedIssuerEntity,
  TrustedRelyingPartyEntity,
  X509TrustMechanismConfiguration,
} from '../trustMechanism'

export type TrustedX509Entity = {
  certificate: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForX509CertificateForOpenId4VpOptions = {
  paradym: ParadymWalletSdk
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustMechanismConfiguration: X509TrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export type GetTrustedEntitiesForX509CertificateForOpenId4VciOptions = {
  paradym: ParadymWalletSdk
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  trustMechanismConfiguration: X509TrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export const getTrustedEntitiesForX509CertificateForOpenId4Vp = async ({
  resolvedAuthorizationRequest,
  paradym,
  walletTrustedEntity,
  trustMechanismConfiguration,
}: GetTrustedEntitiesForX509CertificateForOpenId4VpOptions): Promise<TrustedRelyingPartyEntity> => {
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
        trustedEntities.push({
          entityId: trustedEntity.entityId,
          organizationName: trustedEntity.name,
          logoUri: trustedEntity.logoUri,
          uri: trustedEntity.url,
          demo: trustedEntity.demo,
        })
        entityId = trustedEntity.entityId

        if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)
      }

      organizationName = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata?.client_name
      logoUri = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata?.logo_uri
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

export const getTrustedEntitiesForX509CertificateForOpenId4Vci = async (
  options: GetTrustedEntitiesForX509CertificateForOpenId4VciOptions
): Promise<TrustedIssuerEntity | undefined> => {
  // Checked in the caller
  const signer = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.signer as JwsSignerX5c
  const x509Config = options.paradym.agent.dependencyManager.resolve(X509ModuleConfig)
  try {
    const chain = await options.paradym.agent.x509
      .validateCertificateChain({
        certificateChain: signer.x5c,
        certificate: signer.x5c[0],
        trustedCertificates: x509Config.trustedCertificates,
      })
      .catch(() => null)

    const trustedEntity = chain
      ? options.trustMechanismConfiguration.trustedX509Entities.find((e) =>
          X509Certificate.fromEncodedCertificate(e.certificate).equal(chain[0])
        )
      : null

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
  } catch {
    // no-op
  }
}
