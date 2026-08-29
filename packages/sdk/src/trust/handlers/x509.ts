import {
  type AgentContext,
  type EncodedX509Certificate,
  type JwsSignerX5c,
  X509Api,
  X509Certificate,
  X509ModuleConfig,
} from '@credo-ts/core'
import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type {
  TrustContext,
  TrustedEntity,
  TrustedIssuerEntity,
  TrustedRelyingPartyEntity,
  X509TrustMechanismConfiguration,
} from '../trustMechanism'

/**
 *
 * Validate a certificate chain against the certificates the wallet trusts, and return the trusted
 * root it chains up to — or `null` when it chains up to nothing the wallet trusts.
 *
 * The chain is validated by the agent rather than compared by hand, so an expired, revoked or
 * otherwise broken chain never resolves to a trusted entity.
 *
 */
export const findTrustedX509Entity = async (
  agentContext: AgentContext,
  trustedX509Entities: TrustedX509Entity[],
  certificateChain: Array<EncodedX509Certificate | X509Certificate>
): Promise<TrustedX509Entity | undefined> => {
  const x509Config = agentContext.dependencyManager.resolve(X509ModuleConfig)
  const x509Api = agentContext.dependencyManager.resolve(X509Api)

  const encodedChain = certificateChain.map((certificate) =>
    typeof certificate === 'string' ? certificate : certificate.toString('base64')
  )

  // FIXME: we should return the x509 cert that was matched, then we can just see if it's in
  // the list of hardcoded trusted certificates
  const chain = await x509Api
    .validateCertificateChain({
      certificateChain: encodedChain,
      certificate: encodedChain[0],
      trustedCertificates: x509Config.trustedCertificates,
    })
    .catch(() => null)

  if (!chain) return undefined

  return trustedX509Entities.find((entity) =>
    X509Certificate.fromEncodedCertificate(entity.certificate).equal(chain[0])
  )
}

export type TrustedX509Entity = {
  certificate: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
}

export type GetTrustedEntitiesForX509CertificateForOpenId4VpOptions = TrustContext & {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustMechanismConfiguration: X509TrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export type GetTrustedEntitiesForX509CertificateForOpenId4VciOptions = TrustContext & {
  resolvedCredentialOffer: OpenId4VciResolvedCredentialOffer
  trustMechanismConfiguration: X509TrustMechanismConfiguration
  walletTrustedEntity?: TrustedEntity
}

export const getTrustedEntitiesForX509CertificateForOpenId4Vp = async ({
  resolvedAuthorizationRequest,
  agentContext,
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

  const signer = resolvedAuthorizationRequest.signedAuthorizationRequest?.signer

  try {
    if (signer && signer.method === 'x5c') {
      const trustedEntity = await findTrustedX509Entity(
        agentContext,
        trustMechanismConfiguration.trustedX509Entities,
        signer.x5c
      )
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
  try {
    const trustedEntity = await findTrustedX509Entity(
      options.agentContext,
      options.trustMechanismConfiguration.trustedX509Entities,
      signer.x5c
    )

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
