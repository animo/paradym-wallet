import { ClaimFormat } from '@credo-ts/core'
import { mapAttributeName } from '@package/app/utils/formatSubject'
import { commonMessages, i18n } from '@package/translations'

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

// NOTE: this is a subset
export type Arf18PidSdJwtVcAttributes = {
  given_name: string
  family_name: string

  address: {
    locality: string
    street_address: string
    country: string
    postal_code: string
  }
  birthdate: string
  place_of_birth: {
    country: string
    locality: string
    region: string
  }
  nationalities: string[]
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

export function getPidAttributesForDisplay(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtVc) {
    return getSdJwtPidAttributesForDisplay(attributes)
  }

  return getMdocPidAttributesForDisplay(attributes)
}

export function getSdJwtPidAttributesForDisplay(attributes: Partial<PidSdJwtVcAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const { age_equal_or_over, nationalities, address, place_of_birth, ...remainingAttributes } = attributes

  // Address
  if (address) {
    attributeGroups.push([
      i18n.t(commonMessages.fields.address),
      Object.fromEntries(Object.entries(address).map(([key, value]) => [mapAttributeName(key), value])),
    ])
  }

  // Place of Birth
  if (place_of_birth) {
    attributeGroups.push([i18n.t(commonMessages.fields.place_of_birth), place_of_birth])
  }

  // Nationalities
  if (nationalities) {
    attributeGroups.push([i18n.t(commonMessages.fields.nationalities), nationalities])
  }

  // Age over
  if (age_equal_or_over) {
    attributeGroups.push([i18n.t(commonMessages.fields.age_over), age_equal_or_over])
  }

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [mapAttributeName(key), value]),
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
    [i18n.t(commonMessages.fields.locality)]: resident_city,
    [i18n.t(commonMessages.fields.street)]: resident_street,
    [i18n.t(commonMessages.fields.country)]: resident_country,
    [i18n.t(commonMessages.fields.postal_code)]: resident_postal_code,
  }
  if (Object.values(address).some(Boolean)) {
    attributeGroups.push([
      i18n.t(commonMessages.fields.address),
      Object.fromEntries(Object.entries(address).filter(([_, value]) => value)),
    ])
  }

  // Place of Birth
  if (birth_place) {
    attributeGroups.push([
      i18n.t(commonMessages.fields.place_of_birth),
      { [i18n.t(commonMessages.fields.locality)]: birth_place },
    ])
  }

  // Nationality
  if (nationality) {
    attributeGroups.push([i18n.t(commonMessages.fields.nationalities), [nationality]])
  }

  // Age over
  const ageOverAttributes = { age_over_12, age_over_14, age_over_16, age_over_18, age_over_21, age_over_65 }
  const ageOver = Object.entries(ageOverAttributes)
    .filter(([_, value]) => value)
    .reduce((acc, [key, value]) => ({ ...acc, [key.split('_')[2]]: value }), {})
  if (Object.keys(ageOver).length > 0) {
    attributeGroups.push([i18n.t(commonMessages.fields.age_over), ageOver])
  }

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [mapAttributeName(key), value]),
    ...attributeGroups,
  ])
}
