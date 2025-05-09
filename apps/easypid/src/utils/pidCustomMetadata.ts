import { ClaimFormat } from '@credo-ts/core'
import type { CredentialMetadata } from '@package/agent'
import { sanitizeString } from '@package/utils'

export type PidAttributes = PidMdocAttributes | PidSdJwtVcAttributes

export type PidMdocAttributes = {
  age_birth_year: number
  age_in_years: number
  age_over_12: boolean
  age_over_14: boolean
  age_over_16: boolean
  age_over_18: boolean
  age_over_21: boolean
  age_over_65: boolean
  birth_date: string
  birth_place: string
  expiry_date: string
  family_name: string
  family_name_birth: string
  given_name: string
  issuance_date: string
  issuing_authority: string
  issuing_country: string
  nationality?: string | string[]
  resident_city: string
  resident_country: string
  resident_postal_code: string
  resident_street: string
  portrait?: string
}

// NOTE: this is a subset
export type Arf15PidSdJwtVcAttributes = {
  given_name: string
  family_name: string

  birth_date: string
  birth_place: string
  resident_address: string
  resident_country: string
  resident_state: string
  resident_city: string
  resident_postal_code: string
  resident_street: string
  nationality: string[]
  age_in_years: string
  portrait?: string
}

export type PidSdJwtVcAttributes = {
  issuing_country: string
  issuing_authority: string
  given_name: string
  family_name: string
  birth_family_name: string
  place_of_birth: {
    locality: string
  }
  address: {
    locality: string
    street_address: string
    country: string
    postal_code: string
  }
  age_equal_or_over: Record<string, boolean>
  birthdate: string
  age_in_years: number
  age_birth_year: number
  nationalities: string[]
  iss: string
}

const attributeNameMapping = {
  family_name: 'Family name',
  age_equal_or_over: 'Age over',
  age_birth_year: 'Birth year',
  age_in_years: 'Age',
  street_address: 'Street',
  resident_street: 'Street',
  resident_city: 'City',
  resident_country: 'Country',
  resident_postal_code: 'Postal code',
} as Record<string, string>

export function getPidAttributesForDisplay(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtVc) {
    return getSdJwtPidAttributesForDisplay(attributes)
  }

  return getMdocPidAttributesForDisplay(attributes)
}

export const mapPidAttributeName = (key: string) => {
  return attributeNameMapping[key] ?? sanitizeString(key)
}

export function getSdJwtPidAttributesForDisplay(attributes: Partial<PidSdJwtVcAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const { age_equal_or_over, nationalities, address, place_of_birth, ...remainingAttributes } = attributes

  // Address
  if (address) {
    attributeGroups.push([
      'Address',
      Object.fromEntries(Object.entries(address).map(([key, value]) => [mapPidAttributeName(key), value])),
    ])
  }

  // Place of Birth
  if (place_of_birth) {
    attributeGroups.push([mapPidAttributeName('place_of_birth'), place_of_birth])
  }

  // Nationalities
  if (nationalities) {
    attributeGroups.push([mapPidAttributeName('nationalities'), nationalities])
  }

  // Age over
  if (age_equal_or_over) {
    attributeGroups.push([mapPidAttributeName('age_equal_or_over'), age_equal_or_over])
  }

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [mapPidAttributeName(key), value]),
    ...attributeGroups,
  ])
}

export function getMdocPidAttributesForDisplay(attributes: Partial<PidMdocAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const {
    age_over_12,
    age_over_14,
    age_over_16,
    age_over_18,
    age_over_21,
    age_over_65,
    birth_place,
    resident_city,
    resident_country,
    resident_postal_code,
    resident_street,
    nationality,
    ...remainingAttributes
  } = attributes

  // Address
  const address = {
    locality: resident_city,
    street_address: resident_street,
    country: resident_country,
    postal_code: resident_postal_code,
  }
  if (Object.values(address).some(Boolean)) {
    attributeGroups.push([
      'Address',
      Object.fromEntries(
        Object.entries(address)
          .filter(([_, value]) => value)
          .map(([key, value]) => [attributeNameMapping[key] ?? sanitizeString(key), value])
      ),
    ])
  }

  // Place of Birth
  if (birth_place) {
    attributeGroups.push(['Place of birth', { locality: birth_place }])
  }

  // Nationality
  if (nationality) {
    attributeGroups.push(['Nationalities', [nationality]])
  }

  // Age over
  const ageOverAttributes = { age_over_12, age_over_14, age_over_16, age_over_18, age_over_21, age_over_65 }
  const ageOver = Object.entries(ageOverAttributes)
    .filter(([_, value]) => value)
    .reduce((acc, [key, value]) => ({ ...acc, [key.split('_')[2]]: value }), {})
  if (Object.keys(ageOver).length > 0) {
    attributeGroups.push(['Age over', ageOver])
  }

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [
      attributeNameMapping[key] ?? sanitizeString(key),
      value,
    ]),
    ...attributeGroups,
  ])
}

export function getPidMetadataAttributesForDisplay(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  metadata: CredentialMetadata,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtVc) {
    const { issuedAt, validUntil, type, ...metadataRest } = metadata

    return {
      ...metadataRest,
      issuedAt: issuedAt?.toLocaleString(),
      expiresAt: validUntil?.toLocaleString(),
      credentialType: type,
    }
  }

  if (claimFormat === ClaimFormat.MsoMdoc) {
    const { holder, issuedAt, validUntil, type, ...metadataRest } = metadata
    const { issuance_date, expiry_date } = attributes as PidMdocAttributes

    return {
      ...metadataRest,
      // TODO: we need to extract some issuer value from mdoc, but not sure
      issuer: undefined,
      issuedAt: issuance_date,
      expiresAt: expiry_date,
      credentialType: type,
    }
  }

  // default to regular metadata
  return metadata
}

export function getPidDisclosedAttributeNames(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  return claimFormat === ClaimFormat.SdJwtVc
    ? getSdJwtPidDisclosedAttributeNames(attributes)
    : getMdocPidDisclosedAttributeNames(attributes)
}
export function getMdocPidDisclosedAttributeNames(attributes: Partial<PidMdocAttributes>) {
  const disclosedAttributeNames: string[] = []
  const {
    birth_place,
    age_over_12,
    age_over_14,
    age_over_16,
    age_over_18,
    age_over_21,
    age_over_65,
    resident_city,
    resident_country,
    resident_postal_code,
    resident_street,
    nationality,
    issuing_authority,
    issuing_country,
    issuance_date,
    expiry_date,
    ...remainingAttributes
  } = attributes

  for (const attribute of Object.keys(remainingAttributes)) {
    disclosedAttributeNames.push(attributeNameMapping[attribute] ?? sanitizeString(attribute))
  }

  // Address
  const address = {
    locality: resident_city,
    street_address: resident_street,
    country: resident_country,
    postal_code: resident_postal_code,
  }
  if (Object.values(address).some(Boolean)) {
    disclosedAttributeNames.push(
      ...Object.entries(address)
        .filter(([_, value]) => value)
        .map(
          ([key]) => `Address ${attributeNameMapping[key] ?? sanitizeString(key, { startWithCapitalLetter: false })}`
        )
    )
  }

  // Place of birth
  if (birth_place) {
    disclosedAttributeNames.push('Place of birth')
  }

  // Nationality
  if (nationality) {
    disclosedAttributeNames.push('Nationality')
  }

  // Age over
  const ageOverAttributes = { age_over_12, age_over_14, age_over_16, age_over_18, age_over_21, age_over_65 }
  for (const [key, value] of Object.entries(ageOverAttributes)) {
    if (value) {
      disclosedAttributeNames.push(`Age over ${key.split('_')[2]}`)
    }
  }

  if (issuing_authority) {
    disclosedAttributeNames.push('Issuing authority')
  }
  if (issuing_country) {
    disclosedAttributeNames.push('Issuing country')
  }

  // TODO: we need to extract some issuer value from mdoc, but not sure
  // disclosedAttributeNames.push('Issuer')

  if (issuance_date) {
    disclosedAttributeNames.push('Issued at')
  }
  if (expiry_date) {
    disclosedAttributeNames.push('Expires at')
  }

  // disclosedAttributeNames.push('Credential type')

  return disclosedAttributeNames
}

export function getSdJwtPidDisclosedAttributeNames(attributes: Partial<PidSdJwtVcAttributes>) {
  const disclosedAttributeNames: string[] = []
  const { place_of_birth, age_equal_or_over, address, nationalities, ...remainingAttributes } = attributes

  for (const attribute of Object.keys(remainingAttributes)) {
    disclosedAttributeNames.push(attributeNameMapping[attribute] ?? sanitizeString(attribute))
  }

  // Address
  if (address) {
    const { street_address, ...restAddress } = address
    if (street_address) {
      disclosedAttributeNames.push('Address street')
    }

    disclosedAttributeNames.push(
      ...Object.keys(restAddress).map(
        (key) => `Address ${attributeNameMapping[key] ?? sanitizeString(key, { startWithCapitalLetter: false })}`
      )
    )
  }

  // Place of birth
  if (place_of_birth && Object.keys(place_of_birth).length > 0) {
    disclosedAttributeNames.push('Place of birth')
  }

  // Nationalities
  if (nationalities) {
    disclosedAttributeNames.push('Nationality')
  }

  // Age over
  if (age_equal_or_over) {
    for (const age of Object.keys(age_equal_or_over)) {
      disclosedAttributeNames.push(`Age over ${age}`)
    }
  }

  return disclosedAttributeNames
}
