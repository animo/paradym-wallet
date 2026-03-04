import { X509Certificate } from '@credo-ts/core'
import type { OpenId4VpResolvedAuthorizationRequest } from '@credo-ts/openid4vc'
import type { ParadymWalletSdk } from '../../ParadymWalletSdk'
import type {
  AuthorizationRequestVerificationResult,
  EudiRpAuthenticationTrustMechanismConfiguration,
  TrustedEntity,
} from '../trustMechanism'
import { type GetTrustedEntitiesForX509CertificateOptions, getTrustedEntitiesForX509Certificate } from './x509'

export type TrustList = TrustedEntity & {
  trustList: Array<TrustedEntity & { trustedRelyingPartyRegistrars: Array<TrustedEntity> }>
}

export type GetTrustedEntitiesForEudiRpAuthenticationOptions = {
  paradym: ParadymWalletSdk
  authorizationRequestVerificationResult?: AuthorizationRequestVerificationResult
  resolvedAuthorizationRequest: OpenId4VpResolvedAuthorizationRequest
  trustMechanismConfiguration: EudiRpAuthenticationTrustMechanismConfiguration
}

export const getTrustedEntitiesForEudiRpAuthentication = async (
  options: GetTrustedEntitiesForEudiRpAuthenticationOptions
) => {
  const trustedEntities: TrustedEntity[] = []
  let organizationName: string | undefined
  let logoUri: string | undefined
  let uri: string | undefined
  let entityId: string | undefined

  // We can take the first entry as it only allows 1 entry for now
  // This is the certificate of the relying party
  const [entry] = options.authorizationRequestVerificationResult ?? []

  const matchedCert = options.trustMechanismConfiguration.trustedX509Entities.find(
    (t) => X509Certificate.fromEncodedCertificate(t.certificate).subject === entry.x509RegistrationCertificate.issuer
  )

  if (matchedCert) {
    const dnsName = entry.x509RegistrationCertificate.sanDnsNames[0]
    const uriName = entry.x509RegistrationCertificate.sanUriNames[0]

    organizationName = dnsName
    logoUri = matchedCert.logoUri
    uri = uriName
    entityId = dnsName

    // FIXME: why do we match the SAN dnsName of the registration certificate
    // to the entity-id of the trusted relying party? Shouldn't it be the IAN
    const country = options.trustMechanismConfiguration.trustList.trustList.find(({ trustedRelyingPartyRegistrars }) =>
      trustedRelyingPartyRegistrars.some((rpr) => rpr.entityId === dnsName)
    )

    if (country) {
      const registrar = country.trustedRelyingPartyRegistrars.find((rpr) => rpr.entityId === dnsName) as TrustedEntity
      trustedEntities.push(registrar)
      trustedEntities.push(country)
      trustedEntities.push(options.trustMechanismConfiguration.trustList)
    }
  }

  // Casting works here as eudi_rp_authentication trust mechanism configuration extends
  // x509 trust mechanism configuration
  const { trustedEntities: x509TrustedEntities, relyingParty } = await getTrustedEntitiesForX509Certificate(
    options as unknown as GetTrustedEntitiesForX509CertificateOptions
  )

  return {
    relyingParty: {
      organizationName,
      logoUri,
      uri,
      entityId: entityId ?? relyingParty.entityId,
    },
    trustedEntities: [...x509TrustedEntities, ...trustedEntities],
  }
}
