import { ClaimFormat } from '@credo-ts/core'
import { mapAttributeName } from '@package/agent'
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

// EU Digital Identity Wallet - Person Identification Data (PID) Interface
// Based on ARF Annex 3.01 - PID Rulebook for SD-JWT VC encoding

interface PlaceOfBirth {
  country?: string // Alpha-2 country code as specified in ISO 3166-1
  region?: string // State, province, district, or local area
  locality?: string // Municipality, city, town, or village
}

interface Address {
  formatted?: string // Complete formatted address
  street_address?: string // Street name where the user resides
  house_number?: string // House number including any affix or suffix
  locality?: string // Municipality, city, town, or village
  region?: string // State, province, district, or local area
  postal_code?: string // Postal code of residence
  country?: string // Alpha-2 country code as specified in ISO 3166-1
}

interface AgeEqualOrOver {
  [key: number]: boolean | undefined // Generic age verification for any age
  12?: boolean // Whether user is 12 years old or older
  14?: boolean // Whether user is 14 years old or older
  16?: boolean // Whether user is 16 years old or older
  18?: boolean // Whether user is 18 years old or older (adult)
  21?: boolean // Whether user is 21 years old or older
  65?: boolean // Whether user is 65 years old or older
}

export interface Arf18PidSdJwtVcAttributes {
  // Required mandatory attributes (CIR 2024/2977)
  family_name: string // Current last name(s) or surname(s) of the user
  given_name: string // Current first name(s), including middle name(s) where applicable
  birthdate: string // Date of birth in ISO 8601-1 YYYY-MM-DD format
  place_of_birth: PlaceOfBirth // Country, region, or locality where the user was born (at least one property required)
  nationalities: string[] // One or more alpha-2 country codes representing nationality

  // Required mandatory metadata (CIR 2024/2977)
  date_of_expiry: string // Administrative expiry date in ISO 8601-1 YYYY-MM-DD format
  issuing_authority: string // Name of the administrative authority that issued the PID
  issuing_country: string // Alpha-2 country code of the issuing country

  // Optional attributes (CIR 2024/2977)
  address?: Address // Address where the user currently resides
  personal_administrative_number?: string // Unique administrative number assigned by the provider
  picture?: string // Data URL containing base64-encoded portrait in JPEG format
  birth_family_name?: string // Last name(s) at the time of birth
  birth_given_name?: string // First name(s) at the time of birth
  sex?: number // Sex classification (0=not known, 1=male, 2=female, 3=other, 4=inter, 5=diverse, 6=open, 9=not applicable)
  email?: string // Electronic mail address in conformance with RFC 5322
  phone_number?: string // Mobile telephone number starting with '+' and country code

  // Optional metadata (CIR 2024/2977)
  document_number?: string // Document number assigned by the provider
  issuing_jurisdiction?: string // Country subdivision code as specified in ISO 3166-2:2020

  // Additional optional attributes (PID Rulebook)
  date_of_issuance?: string // Date when the PID was issued in ISO 8601-1 YYYY-MM-DD format
  age_equal_or_over?: AgeEqualOrOver // Boolean indicators for age thresholds
  age_in_years?: number // Current age in years
  age_birth_year?: number // Year when the user was born
  trust_anchor?: string // URL for machine-readable trust anchor information
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

export function formatArfPid18PlaceOfBirth(place: PlaceOfBirth): string | null {
  const { country, region, locality } = place

  // If nothing is provided, return empty string
  if (!country && !region && !locality) {
    return null
  }

  // Build the string from most specific to least specific
  const parts: string[] = []

  // Add locality if available
  if (locality) {
    parts.push(locality)
  }

  // Add region if available and different from locality
  if (region && region !== locality) {
    parts.push(region)
  }

  // Handle country code
  if (country) {
    if (parts.length > 0) {
      // Add country in parentheses if we have other location info
      return `${parts.join(', ')} (${country})`
    }

    // Just return country code if that's all we have
    return country
  }

  // If no country but we have region/locality
  return parts.join(', ')
}

export function getPidAttributesForDisplay(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  claimFormat: ClaimFormat.SdJwtDc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtDc) {
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
