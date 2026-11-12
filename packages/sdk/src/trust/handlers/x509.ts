import {
  type AgentContext,
  type EncodedX509Certificate,
  type JwsSignerX5c,
  X509Api,
  X509Certificate,
  X509ModuleConfig,
} from '@credo-ts/core'
import type { OpenId4VciResolvedCredentialOffer, OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import { eudiEntityId, noneEntityId, x509CertificateEntityId, x509EntityId } from '../entityId'
import { getPartyDisplay, type TrustedEntityDisplay } from '../partyDisplay'
import {
  checkOfferForRegistration,
  checkRequestForOverAsking,
  getPartyRegistration,
  type PartyRegistration,
} from '../registrationCertificate'
import { findTrustedListEntities } from '../trustedLists'
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
 * root it chains up to — or `undefined` when it chains up to nothing the wallet trusts. Along with the
 * root comes the most specific of its children whose certificate is in the chain, if any.
 *
 * The chain is validated by the agent rather than compared by hand, so an expired, revoked or
 * otherwise broken chain never resolves to a trusted entity.
 *
 */
export const findTrustedX509Entity = async (
  agentContext: AgentContext,
  trustedX509Entities: TrustedX509Entity[],
  certificateChain: Array<EncodedX509Certificate | X509Certificate>
): Promise<TrustedX509Match | undefined> => {
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

  // The validated chain starts at the trusted certificate and ends at the leaf
  const entity = trustedX509Entities.find((entity) =>
    X509Certificate.fromEncodedCertificate(entity.certificate).equal(chain[0])
  )
  if (!entity) return undefined

  const child = chain
    .slice(1)
    .reverse()
    .map((certificate) =>
      entity.children?.find((child) => X509Certificate.fromEncodedCertificate(child.certificate).equal(certificate))
    )
    .find((child) => child !== undefined)

  return { entity, child }
}

export type TrustedX509Entity = {
  /** The certificate a chain is validated up to, usually a root. */
  certificate: string
  name: string
  logoUri: string
  url: string
  demo?: boolean
  entityId: string
  /** Whose name and logo a party under this certificate is shown with, when none of the `children` matches. */
  display: TrustedEntityDisplay
  children?: TrustedX509ChildEntity[]
}

/**
 * A party under a trusted entity, recognized by a certificate in the chain it presents: an intermediate
 * or its own leaf. It's shown with its own name and logo, approved by the trusted entity. It's no trust
 * anchor: the chain is still validated up to the trusted entity.
 */
export type TrustedX509ChildEntity = {
  certificate: string
  name: string
  logoUri: string
  url: string
  entityId: string
}

export type TrustedX509Match = { entity: TrustedX509Entity; child?: TrustedX509ChildEntity }

/**
 * The trusted entity of a party that matches it. It's the party itself, with `partyEntityId`, when the party
 * is shown as the entity. A matched child, or a party shown as it presents itself, is a party the entity approves.
 */
export const x509MatchTrustedEntity = ({ entity, child }: TrustedX509Match, partyEntityId: string): TrustedEntity => ({
  entityId: child || entity.display === 'external' ? x509EntityId(entity.entityId) : partyEntityId,
  organizationName: entity.name,
  logoUri: entity.logoUri,
  uri: entity.url,
  demo: entity.demo,
})

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
  let overAsking: TrustedRelyingPartyEntity['overAsking']
  let registration: PartyRegistration | undefined
  const uri =
    typeof resolvedAuthorizationRequest.authorizationRequestPayload.response_uri === 'string'
      ? new URL(resolvedAuthorizationRequest.authorizationRequestPayload.response_uri).origin
      : undefined
  const { effectiveClientId } = resolvedAuthorizationRequest.verifier
  let entityId = noneEntityId(effectiveClientId)

  const signer = resolvedAuthorizationRequest.signedAuthorizationRequest?.signer

  try {
    if (signer && signer.method === 'x5c') {
      const clientMetadata = resolvedAuthorizationRequest.authorizationRequestPayload.client_metadata
      const match = await findTrustedX509Entity(
        agentContext,
        trustMechanismConfiguration.trustedX509Entities,
        signer.x5c
      )
      const trustedListEntities = match
        ? undefined
        : await findTrustedListEntities(
            agentContext,
            trustMechanismConfiguration.accessCertificateTrustedLists ?? [],
            signer.x5c
          )

      if (match) {
        const party =
          match.child ??
          getPartyDisplay(match.entity.display, match.entity, {
            name: clientMetadata?.client_name,
            logoUri: clientMetadata?.logo_uri,
            certificate: signer.x5c[0],
          })
        organizationName = party.name
        logoUri = party.logoUri
        // A matched child is the same party in every request and offer
        entityId = match.child
          ? x509EntityId(match.entity.entityId, match.child.entityId)
          : x509CertificateEntityId(match.entity.entityId, signer.x5c[0])
        trustedEntities.push(x509MatchTrustedEntity(match, entityId))

        if (walletTrustedEntity) trustedEntities.push(walletTrustedEntity)
      } else if (trustedListEntities) {
        // The access certificate provider vouches for the party, not the wallet
        trustedEntities.push(...trustedListEntities.trustedEntities)

        // Only a party trusted through the lists has to stay within its registration certificate
        const registrationCheck = await checkRequestForOverAsking(
          agentContext,
          trustMechanismConfiguration.registrationCertificateTrustedLists ?? [],
          resolvedAuthorizationRequest,
          signer.x5c[0]
        )
        overAsking = registrationCheck.overAsking
        // Behind an intermediary, only the registration certificate names the relying party itself.
        // The access certificate provider vouches for the name in the certificate, while only the verifier
        // itself vouches for the client metadata. Its logo would sit next to a name it didn't choose.
        const { registrationCertificate } = registrationCheck
        organizationName = registrationCertificate?.name ?? trustedListEntities.organizationName
        const identifier = registrationCertificate?.sub ?? trustedListEntities.subjectIdentifier
        if (identifier) entityId = eudiEntityId(identifier)
        registration = getPartyRegistration(registrationCertificate, trustedListEntities.contact)
      } else {
        organizationName = clientMetadata?.client_name
        logoUri = clientMetadata?.logo_uri
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
    overAsking,
    registration,
  }
}

export const getTrustedEntitiesForX509CertificateForOpenId4Vci = async (
  options: GetTrustedEntitiesForX509CertificateForOpenId4VciOptions
): Promise<TrustedIssuerEntity | undefined> => {
  // Checked in the caller
  const signer = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.signer as JwsSignerX5c
  const metadataDisplay = options.resolvedCredentialOffer.metadata.signedCredentialIssuer?.jwt.payload.display?.[0]
  const credentialIssuer = options.resolvedCredentialOffer.metadata.credentialIssuer.credential_issuer
  try {
    const match = await findTrustedX509Entity(
      options.agentContext,
      options.trustMechanismConfiguration.trustedX509Entities,
      signer.x5c
    )

    if (match) {
      const party =
        match.child ??
        getPartyDisplay(match.entity.display, match.entity, {
          name: metadataDisplay?.name,
          logoUri: metadataDisplay?.logo?.uri,
          certificate: signer.x5c[0],
        })
      const entityId = x509EntityId(match.entity.entityId, match.child?.entityId ?? credentialIssuer)

      const trustedEntities = [x509MatchTrustedEntity(match, entityId)]
      if (options.walletTrustedEntity) trustedEntities.push(options.walletTrustedEntity)

      return {
        issuer: {
          organizationName: party.name,
          logoUri: party.logoUri,
          uri: match.child?.url ?? match.entity.url,
          entityId,
        },
        trustedEntities,
      }
    }

    const trustedListEntities = await findTrustedListEntities(
      options.agentContext,
      options.trustMechanismConfiguration.accessCertificateTrustedLists ?? [],
      signer.x5c
    )
    if (trustedListEntities) {
      // Only an issuer trusted through the lists has to stay within its registration certificate
      const { issuerRegistration, registrationCertificate } = await checkOfferForRegistration(
        options.agentContext,
        options.trustMechanismConfiguration.registrationCertificateTrustedLists ?? [],
        options.resolvedCredentialOffer,
        signer.x5c[0]
      )
      // Behind an intermediary, only the registration certificate names the issuer itself
      const identifier = registrationCertificate?.sub ?? trustedListEntities.subjectIdentifier
      return {
        issuer: {
          // The access certificate provider vouches for the name in the certificate, so the logo from the
          // issuer's own metadata is left out
          organizationName:
            registrationCertificate?.name ??
            trustedListEntities.organizationName ??
            metadataDisplay?.name ??
            credentialIssuer,
          entityId: identifier ? eudiEntityId(identifier) : noneEntityId(credentialIssuer),
        },
        // The access certificate provider vouches for the issuer, not the wallet
        trustedEntities: trustedListEntities.trustedEntities,
        issuerRegistration,
        registration: getPartyRegistration(registrationCertificate, trustedListEntities.contact),
      }
    }
  } catch {
    // no-op
  }
}
