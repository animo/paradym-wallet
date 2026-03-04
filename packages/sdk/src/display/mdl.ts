import { sanitizeString } from './strings'

type DrivingPrivilege = {
  codes: string[]
  expiry_date: string
  issue_date: string
  vehicle_category_code: string
}

type MdlAttributes = {
  birth_date: string
  document_number: string
  driving_privileges: Array<DrivingPrivilege>
  expiry_date: string
  family_name: string
  given_name: string
  issue_date: string
  issuing_authority: string
  issuing_country: string
  portrait: string
  un_distinguishing_sign: string

  // There can be multiple and random age_over_XX attributes
  [key: string]: unknown
}

const attributeNameMapping = {
  family_name: 'Family name',
  given_name: 'Given name',
  birth_date: 'Birth date',
  document_number: 'Document number',
  portrait: 'Portrait',
  un_distinguishing_sign: 'UN sign',
  issuing_authority: 'Issuing authority',
  issuing_country: 'Issuing country',
  expiry_date: 'Expiry date',
  issue_date: 'Issue date',
  driving_privileges: 'Driving privileges',
  codes: 'Codes',
  code: 'Code',
  vehicle_category_code: 'Vehicle category code',
} as Record<string, string>

const mapMdlAttributeName = (key: string) => {
  return attributeNameMapping[key] ?? sanitizeString(key)
}

export function getMdlAttributesForDisplay(attributes: Partial<MdlAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const { driving_privileges, ...remainingAttributes } = attributes

  const ageOverEntries = Object.entries(remainingAttributes).filter(([key]) => key.startsWith('age_over_'))

  const remainingWithoutAgeEntries = Object.fromEntries(
    Object.entries(remainingAttributes).filter(([key]) => !key.startsWith('age_over_'))
  )

  if (driving_privileges) {
    attributeGroups.push([
      'Driving privileges',
      Object.fromEntries(Object.entries(driving_privileges).map(([key, value]) => [mapMdlAttributeName(key), value])),
    ])
  }

  if (ageOverEntries.length > 0) {
    attributeGroups.push(['Age over', Object.fromEntries(ageOverEntries)])
  }

  return Object.fromEntries([
    ...Object.entries(remainingWithoutAgeEntries).map(([key, value]) => [mapMdlAttributeName(key), value]),
    ...attributeGroups,
  ])
}
