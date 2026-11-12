import type { EncodedX509Certificate, X509Certificate } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { OverAskingResult } from '@owf/eudi-registration-certificate'
import type { DisplayImage } from '../display/credential'
import { eudiEntityId, noneEntityId, x509EntityId } from './entityId'
import { findTrustedX509Entity, x509MatchTrustedEntity } from './handlers/x509'
import { getPartyDisplay } from './partyDisplay'
import type { PartyRegistration } from './registrationCertificate'
import { findTrustedListEntities } from './trustedLists'
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
  /**
   * Whether the request stays within the registration certificate it carries. Only for a party trusted
   * through the lists of access certificate providers, when lists of registration certificate providers
   * are configured.
   */
  overAsking?: OverAskingResult
  /** What the party registered, for a party trusted through the lists of access certificate providers */
  registration?: PartyRegistration
}

const toVerifier = (
  relyingParty: { entityId: string; organizationName?: string; uri?: string; logoUri?: string },
  trustedEntities: TrustedEntity[],
  registration?: PartyRegistration
): RequestVerifier => ({
  entityId: relyingParty.entityId,
  name: relyingParty.organizationName,
  hostName: relyingParty.uri,
  logo: relyingParty.logoUri ? { url: relyingParty.logoUri } : undefined,
  trustedEntities,
  registration,
})

export type GetVerifierForOpenId4VpRequestOptions = TrustContext & {
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
}

/**
 *
 * Who is asking, for an OpenID4VP request, established with the configured trust mechanisms.
 *
 */
export const getVerifierForOpenId4VpRequest = async ({
  agentContext,
  trustMechanisms,
  resolvedAuthorizationRequest,
}: GetVerifierForOpenId4VpRequestOptions): Promise<{ verifier: RequestVerifier; trustMechanism: TrustMechanism }> => {
  const { trustMechanism, trustedEntities, relyingParty, overAsking, registration } =
    await getTrustedEntitiesForOpenId4Vp({
      agentContext,
      trustMechanisms,
      resolvedAuthorizationRequest,
    })

  return { trustMechanism, verifier: { ...toVerifier(relyingParty, trustedEntities, registration), overAsking } }
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
 * certificates and trusted lists OpenID4VP is verified against. Without reader auth, or when the chain
 * leads nowhere the wallet trusts, the origin is all the wallet knows.
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
    verifier: { entityId: noneEntityId(`origin:${origin}`), hostName: origin, trustedEntities: [] },
  }
  if (!readerCertificateChain?.length) return untrusted

  const x509Configuration = trustMechanisms.find(
    (trustMechanism): trustMechanism is X509TrustMechanismConfiguration =>
      'trustMechanism' in trustMechanism && trustMechanism.trustMechanism === 'x509'
  )
  if (!x509Configuration) return untrusted

  const walletTrustedEntity = trustMechanisms.find(
    (trustMechanism): trustMechanism is { walletTrustedEntity?: TrustedEntity } =>
      'walletTrustedEntity' in trustMechanism
  )?.walletTrustedEntity

  const match = await findTrustedX509Entity(
    agentContext,
    x509Configuration.trustedX509Entities,
    readerCertificateChain
  ).catch(() => undefined)

  if (!match) {
    const trustedListEntities = await findTrustedListEntities(
      agentContext,
      x509Configuration.accessCertificateTrustedLists ?? [],
      readerCertificateChain
    ).catch(() => undefined)
    if (!trustedListEntities) return untrusted

    // The access certificate provider vouches for the reader, not the wallet
    const { organizationName, subjectIdentifier, trustedEntities } = trustedListEntities
    return {
      trustMechanism: 'x509',
      verifier: toVerifier(
        {
          entityId: subjectIdentifier ? eudiEntityId(subjectIdentifier) : untrusted.verifier.entityId,
          organizationName,
          uri: origin,
        },
        trustedEntities
      ),
    }
  }

  // Reader authentication carries no metadata, so all the reader provides itself is the name in its certificate
  const leafCertificate = readerCertificateChain[0]
  const party =
    match.child ??
    getPartyDisplay(match.entity.display, match.entity, {
      certificate: typeof leafCertificate === 'string' ? leafCertificate : leafCertificate.toString('base64'),
    })
  // A matched child is the same party in every request and offer
  const entityId = x509EntityId(match.entity.entityId, match.child?.entityId ?? `origin:${origin}`)
  const trustedEntities = [x509MatchTrustedEntity(match, entityId)]
  if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)

  return {
    trustMechanism: 'x509',
    verifier: toVerifier(
      {
        entityId,
        organizationName: party.name,
        uri: origin,
        logoUri: party.logoUri,
      },
      trustedEntities
    ),
  }
}
