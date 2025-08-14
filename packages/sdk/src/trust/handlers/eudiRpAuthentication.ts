import { X509Certificate } from '@credo-ts/core'
import type { AuthorizationRequestVerificationResult, TrustedEntity } from '../trustMechanism'
import {
  type GetTrustedEntitiesForX509CertificateOptions,
  type TrustedX509Entity,
  getTrustedEntitiesForX509Certificate,
} from './x509'

export type TrustList = TrustedEntity & {
  trustList: Array<TrustedEntity & { trustedRelyingPartyRegistrars: Array<TrustedEntity> }>
}

export type GetTrustedEntitiesForEudiRpAuthenticationOptions = {
  authorizationRequestVerificationResult?: AuthorizationRequestVerificationResult
  trustedX509Entities: TrustedX509Entity[]
  trustList: TrustList
} & GetTrustedEntitiesForX509CertificateOptions

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

  const matchedCert = options.trustedX509Entities.find(
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
    const country = options.trustList.trustList.find(({ trustedRelyingPartyRegistrars }) =>
      trustedRelyingPartyRegistrars.some((rpr) => rpr.entityId === dnsName)
    )

    if (country) {
      const registrar = country.trustedRelyingPartyRegistrars.find((rpr) => rpr.entityId === dnsName) as TrustedEntity
      trustedEntities.push(registrar)
      trustedEntities.push(country)
      trustedEntities.push(options.trustList)
    }
  }

  const { trustedEntities: x509TrustedEntities, relyingParty } = await getTrustedEntitiesForX509Certificate(options)

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
