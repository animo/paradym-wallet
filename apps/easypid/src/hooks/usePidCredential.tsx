import { ClaimFormat } from '@credo-ts/core'
import { useSeedCredentialPidData } from '@easypid/storage'
import { type CredentialMetadata, useCredentialsForDisplay } from '@package/agent'
import { capitalizeFirstLetter, sanitizeString } from '@package/utils'
import { useMemo } from 'react'

type Attributes = {
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
  }

  [key: string]: unknown
}

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
  nationality?: string
  resident_city: string
  resident_country: string
  resident_postal_code: string
  resident_street: string
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
  age_equal_or_over: 'Age over',
  age_birth_year: 'Birth year',
  age_in_years: 'Age',
  street_address: 'Street',
} as Record<string, string>

export function getPidAttributesForDisplay(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  metadata: CredentialMetadata,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtVc) {
    return getSdJwtPidAttributesForDisplay(attributes, metadata)
  }

  return getMdocPidAttributesForDisplay(attributes, metadata)
}

export function getSdJwtPidAttributesForDisplay(
  attributes: Partial<PidSdJwtVcAttributes | Attributes>,
  metadata: CredentialMetadata
) {
  const attributeGroups: Array<[string, unknown]> = []

  const {
    age_equal_or_over,
    nationalities,
    address,
    place_of_birth,
    issuing_authority,
    issuing_country,
    ...remainingAttributes
  } = attributes

  // Address
  if (address) {
    attributeGroups.push([
      'Address',
      Object.fromEntries(
        Object.entries(address).map(([key, value]) => [attributeNameMapping[key] ?? sanitizeString(key), value])
      ),
    ])
  }

  // Place of Birth
  if (place_of_birth) {
    attributeGroups.push(['Place of birth', place_of_birth])
  }

  // Nationalities
  if (nationalities) {
    attributeGroups.push(['Nationalities', nationalities])
  }

  // Age over
  if (age_equal_or_over) {
    attributeGroups.push(['Age over', age_equal_or_over])
  }

  // TODO: how to disclose holder?
  const { holder, issuedAt, validUntil, type, ...metadataRest } = metadata

  // Metadata
  attributeGroups.push([
    'Credential Information',
    {
      issuing_authority,
      issuing_country,
      ...metadataRest,
      issuedAt: issuedAt?.toLocaleString(),
      expiresAt: validUntil?.toLocaleString(),
      credentialType: type,
    },
  ])

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [
      attributeNameMapping[key] ?? sanitizeString(key),
      value,
    ]),
    ...attributeGroups,
  ])
}

export function getMdocPidAttributesForDisplay(attributes: Partial<PidMdocAttributes>, metadata: CredentialMetadata) {
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
    issuing_authority,
    issuing_country,
    issuance_date,
    expiry_date,
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

  // TODO: how to disclose holder?
  const { holder, type, issuer, ...metadataRest } = metadata

  // Metadata
  attributeGroups.push([
    'Credential Information',
    {
      issuing_authority,
      issuing_country,
      ...metadataRest,
      // TODO: we need to extract some issuer value from mdoc, but not sure
      issuer: undefined,
      issuedAt: issuance_date,
      expiresAt: expiry_date,
      credentialType: type,
    },
  ])

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [
      attributeNameMapping[key] ?? sanitizeString(key),
      value,
    ]),
    ...attributeGroups,
  ])
}

export function getPidDisclosedAttributeNames(
  attributes: Partial<PidMdocAttributes | PidSdJwtVcAttributes>,
  claimFormat: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
) {
  if (claimFormat === ClaimFormat.SdJwtVc) {
    return getSdJwtPidDisclosedAttributeNames(attributes)
  }

  return getMdocPidDisclosedAttributeNames(attributes)
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

  disclosedAttributeNames.push('Credential type')

  return disclosedAttributeNames
}

export function getSdJwtPidDisclosedAttributeNames(attributes: Partial<PidSdJwtVcAttributes | Attributes>) {
  const disclosedAttributeNames: string[] = []
  const {
    place_of_birth,
    age_equal_or_over,
    address,
    nationalities,
    issuing_authority,
    issuing_country,
    ...remainingAttributes
  } = attributes

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

  if (issuing_authority) {
    disclosedAttributeNames.push('Issuing authority')
  }
  if (issuing_country) {
    disclosedAttributeNames.push('Issuing country')
  }

  disclosedAttributeNames.push('Issuer')
  disclosedAttributeNames.push('Issued at')

  // FIXME: should not be included in case of B' flow ( or at least currnetlh the count doesn't match with the displayed attributes)
  disclosedAttributeNames.push('Expires at')

  disclosedAttributeNames.push('Credential type')

  return disclosedAttributeNames
}

// TODO: Is it possible we add the branding/display elements when the PID is added to the wallet
// This way we can just treat it as any other credential and don't need to special case it anywhere
export function usePidCredential() {
  const { isLoading, credentials } = useCredentialsForDisplay()
  const { isLoading: isSeedCredentialLoading } = useSeedCredentialPidData()

  const pidCredential = useMemo(() => {
    const credential = credentials.find((cred) => cred.metadata.type === 'urn:eu.europa.ec.eudi:pid:1')
    if (credential) {
      const attributes = credential.attributes as PidSdJwtVcAttributes
      return {
        id: credential.id,
        type: credential.metadata.type,
        attributes,
        display: usePidDisplay(),
        userName: `${capitalizeFirstLetter(attributes.given_name.toLowerCase())}`,
        attributesForDisplay: getSdJwtPidAttributesForDisplay(attributes, credential.metadata),
      }
    }

    return undefined
  }, [credentials])

  if (isLoading || isSeedCredentialLoading) {
    return {
      credential: undefined,
      isLoading: true,
    } as const
  }

  return {
    isLoading: false,
    credential: pidCredential,
  } as const
}

export const usePidDisplay = () => {
  return {
    issuer: {
      name: 'Germany',
      locale: 'de',
      logo: {
        url: require('../../assets/german-issuer-image.png'),
        altText: 'Logo of German Government',
      },
    },
    name: 'Personalausweis',
    description: 'This is a personal ID',
    locale: 'de',
    textColor: '#2F3544',
    backgroundColor: '#CCCEBF',
    backgroundImage: {
      url: require('../../assets/pid-background.png'),
      altText: 'Background Image',
    },
  }
}
