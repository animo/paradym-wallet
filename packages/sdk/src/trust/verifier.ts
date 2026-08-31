import { verifyOpenid4VpAuthorizationRequest } from '@animo-id/eudi-wallet-functionality'
import type { EncodedX509Certificate, X509Certificate } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { DisplayImage } from '../display/credential'
import { findTrustedX509Entity } from './handlers/x509'
import {
  getTrustedEntitiesForOpenId4Vp,
  type TrustContext,
  type TrustedEntity,
  type TrustMechanism,
  type X509TrustMechanismConfiguration,
} from './trustMechanism'

/**
 *
 * The other party of a presentation request, as the wallet was able to establish it.
 *
 * The same shape everywhere a request is reviewed — the app's share flow and the credential request
 * UI both render this.
 *
 */
export type RequestVerifier = {
  entityId: string
  name?: string
  hostName?: string
  logo?: DisplayImage
  trustedEntities: TrustedEntity[]
}

const toVerifier = (
  relyingParty: { entityId: string; organizationName?: string; uri?: string; logoUri?: string },
  trustedEntities: TrustedEntity[]
): RequestVerifier => ({
  entityId: relyingParty.entityId,
  name: relyingParty.organizationName,
  hostName: relyingParty.uri,
  logo: relyingParty.logoUri ? { url: relyingParty.logoUri } : undefined,
  trustedEntities,
})

export type GetVerifierForOpenId4VpRequestOptions = TrustContext & {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  allowUntrusted?: boolean
}

/**
 *
 * Who is asking, for an OpenID4VP request: EUDI relying party authentication when the request
 * carries a registration certificate, and the configured trust mechanisms otherwise.
 *
 */
export const getVerifierForOpenId4VpRequest = async ({
  agentContext,
  trustMechanisms,
  resolvedAuthorizationRequest,
  allowUntrusted,
}: GetVerifierForOpenId4VpRequestOptions): Promise<{ verifier: RequestVerifier; trustMechanism: TrustMechanism }> => {
  const authorizationRequestVerificationResult = await verifyOpenid4VpAuthorizationRequest(agentContext, {
    resolvedAuthorizationRequest,
    allowUntrustedSigned: allowUntrusted,
  })

  const { trustMechanism, trustedEntities, relyingParty } = await getTrustedEntitiesForOpenId4Vp({
    agentContext,
    trustMechanisms,
    resolvedAuthorizationRequest,
    authorizationRequestVerificationResult,
  })

  return { trustMechanism, verifier: toVerifier(relyingParty, trustedEntities) }
}

export type GetVerifierForMdocReaderAuthenticationOptions = TrustContext & {
  /** The reader's certificate chain, when the request carried reader authentication. */
  readerCertificateChain?: Array<EncodedX509Certificate | X509Certificate>
  /** The origin the platform reported, used as the identity when nothing better is known. */
  origin: string
}

/**
 *
 * Who is asking, for an ISO 18013-7 `org-iso-mdoc` request.
 *
 * There is no client metadata and no signed request here — reader authentication is the only trust
 * signal, so the reader's chain is validated against the wallet's `x509` trust mechanism, the same
 * certificates OpenID4VP is verified against. Without reader auth, or when the chain leads nowhere
 * the wallet trusts, the origin is all the wallet knows.
 *
 */
export const getVerifierForMdocReaderAuthentication = async ({
  agentContext,
  trustMechanisms,
  readerCertificateChain,
  origin,
}: GetVerifierForMdocReaderAuthenticationOptions): Promise<{
  verifier: RequestVerifier
  trustMechanism: TrustMechanism
}> => {
  const untrusted = {
    trustMechanism: 'none' as const,
    verifier: { entityId: origin, hostName: origin, trustedEntities: [] },
  }
  if (!readerCertificateChain?.length) return untrusted

  const x509Configuration = trustMechanisms.find(
    (trustMechanism): trustMechanism is X509TrustMechanismConfiguration =>
      'trustMechanism' in trustMechanism && trustMechanism.trustMechanism === 'x509'
  )
  if (!x509Configuration) return untrusted

  const trustedEntity = await findTrustedX509Entity(
    agentContext,
    x509Configuration.trustedX509Entities,
    readerCertificateChain
  ).catch(() => undefined)
  if (!trustedEntity) return untrusted

  const walletTrustedEntity = trustMechanisms.find(
    (trustMechanism): trustMechanism is { walletTrustedEntity?: TrustedEntity } =>
      'walletTrustedEntity' in trustMechanism
  )?.walletTrustedEntity

  const trustedEntities: TrustedEntity[] = [
    {
      entityId: trustedEntity.entityId,
      organizationName: trustedEntity.name,
      logoUri: trustedEntity.logoUri,
      uri: trustedEntity.url,
      demo: trustedEntity.demo,
    },
  ]
  if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)

  return {
    trustMechanism: 'x509',
    verifier: toVerifier(
      {
        entityId: trustedEntity.entityId,
        organizationName: trustedEntity.name,
        uri: origin,
        logoUri: trustedEntity.logoUri,
      },
      trustedEntities
    ),
  }
}
