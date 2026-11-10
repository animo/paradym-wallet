import { parseCertificate } from '@owf/x509'

// The scopes of `TrustedEntity.entityId`, so a party gets the same key everywhere it is identified

export const eudiEntityId = (semanticIdentifier: string) => `eudi:${semanticIdentifier}`

export const x509EntityId = (trustedEntityId: string, identifier?: string) =>
  identifier === undefined ? `x509:${trustedEntityId}` : `x509:${trustedEntityId}:${identifier}`

/**
 * The party of a certificate that leads to a trusted entity. A CA gives each subject entity its own subject name,
 * and may give it again in a renewed certificate (RFC 5280 clause 4.1.2.6), so the issuer and subject name identify
 * the party. A certificate without a subject name is only known by the trusted entity it leads to.
 */
export const x509CertificateEntityId = (trustedEntityId: string, certificate: string) => {
  const { issuer, subject } = parseCertificate(certificate)
  return x509EntityId(
    trustedEntityId,
    subject.attributes.length > 0 ? JSON.stringify([issuer.rfc4514, subject.rfc4514]) : undefined
  )
}

export const noneEntityId = (identifier: string) => `none:${identifier}`
