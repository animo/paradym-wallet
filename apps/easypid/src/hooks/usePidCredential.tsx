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

type PidSdJwtVcAttributes = {
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
}

const attributeNameMapping = {
  age_equal_or_over: 'Age over',
  age_birth_year: 'Birth year',
  age_in_years: 'Age',
  street_address: 'Street',
} as Record<string, string>

export function getPidAttributesForDisplay(
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

export function getPidDisclosedAttributeNames(attributes: Partial<PidSdJwtVcAttributes | Attributes>) {
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
  disclosedAttributeNames.push('Expires at')
  disclosedAttributeNames.push('Credential type')

  return disclosedAttributeNames
}

export function usePidCredential() {
  const { isLoading, credentials } = useCredentialsForDisplay()
  const { isLoading: isSeedCredentialLoading, seedCredential } = useSeedCredentialPidData()

  const pidCredential = useMemo(() => {
    if (seedCredential) {
      return {
        id: 'seed-credential',
        attributes: seedCredential.pid_data,
        userName: `${capitalizeFirstLetter(seedCredential.pid_data.given_name.toLowerCase())}`,
        display: seedCredential.display,
      }
    }

    if (credentials[0]) {
      const credential = credentials[0]
      const attributes = credential.attributes as PidSdJwtVcAttributes
      return {
        id: credential.id,
        attributes,
        userName: `${capitalizeFirstLetter(attributes.given_name.toLowerCase())}`,
        display: credential.display,
        attributesForDisplay: getPidAttributesForDisplay(attributes, credential.metadata),
      }
    }

    return undefined
  }, [seedCredential, credentials[0]])

  if (isLoading || isSeedCredentialLoading || !pidCredential) {
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
