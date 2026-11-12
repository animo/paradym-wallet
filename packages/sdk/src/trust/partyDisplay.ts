import { parseCertificate } from '@owf/x509'

/**
 * Whose name and logo a party that matches a trusted entity is shown with: the ones registered for the
 * trusted entity, or the ones the party provides itself in the request or offer.
 */
export type TrustedEntityDisplay = 'entity' | 'external'

/**
 * The name and logo of a party that matches `entity`. What the party provides is its metadata, or else the
 * name in the certificate it presents, which comes without a logo. The metadata only counts as a pair, so
 * the party's own logo never sits next to the entity's name. Without either, it's the entity's.
 */
export const getPartyDisplay = (
  display: TrustedEntityDisplay,
  entity: { name: string; logoUri?: string },
  provided: { name?: string; logoUri?: string; certificate?: string }
) => {
  if (display === 'external') {
    if (provided.name) return { name: provided.name, logoUri: provided.logoUri }

    // As for an access certificate (ETSI TS 119 411-8 GEN-6.1.1-04), the common name is the name users recognise
    const subject = provided.certificate ? parseCertificate(provided.certificate).subject : undefined
    const certificateName = subject?.commonName ?? subject?.organizationName
    if (certificateName) return { name: certificateName, logoUri: undefined }
  }

  return { name: entity.name, logoUri: entity.logoUri }
}
