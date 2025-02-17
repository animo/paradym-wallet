import { sanitizeString } from '@package/utils'

import mdlCodeA from '../../assets/mdl/code-a.png'
import mdlCodeB from '../../assets/mdl/code-b.png'
import mdlCodeC from '../../assets/mdl/code-c.png'
import mdlCodeC1 from '../../assets/mdl/code-c1.png'
import mdlCodeD from '../../assets/mdl/code-d.png'
import mdlCodeD1 from '../../assets/mdl/code-d1.png'

export type MdlAttributes = MdlSdJwtVcAttributes | MdlMdocAttributes

export type MdlSdJwtVcAttributes = {
  age_over_21: boolean
  age_over_60: boolean
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
}

type DrivingPrivilege = {
  codes: string[]
  expiry_date: string
  issue_date: string
  vehicle_category_code: string
}

export type MdlMdocAttributes = {
  age_over_18: boolean
  age_over_21: boolean
  age_over_60: boolean
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
  age_over_21: 'Age over 21',
  age_over_60: 'Age over 60',
  codes: 'Codes',
  code: 'Code',
  vehicle_category_code: 'Vehicle category code',
} as Record<string, string>

export const mapMdlAttributeName = (key: string) => {
  return attributeNameMapping[key] ?? sanitizeString(key)
}

export function getMdlAttributesForDisplay(attributes: Partial<MdlSdJwtVcAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const {
    age_over_21,
    age_over_60,
    birth_date,
    document_number,
    portrait,
    un_distinguishing_sign,
    issuing_authority,
    issuing_country,
    expiry_date,
    issue_date,
    driving_privileges,
    ...remainingAttributes
  } = attributes

  if (driving_privileges) {
    attributeGroups.push([
      'Driving privileges',
      Object.fromEntries(Object.entries(driving_privileges).map(([key, value]) => [mapMdlAttributeName(key), value])),
    ])
  }

  return Object.fromEntries([
    ...Object.entries(remainingAttributes).map(([key, value]) => [mapMdlAttributeName(key), value]),
    ...attributeGroups,
  ])
}

export function getImageForMdlCode(code: string) {
  switch (code) {
    case 'A':
      return mdlCodeA
    case 'B':
      return mdlCodeB
    case 'C':
      return mdlCodeC
    case 'C1':
      return mdlCodeC1
    case 'D':
      return mdlCodeD
    case 'D1':
      return mdlCodeD1
    default:
      // Default to B for unknown codes
      return mdlCodeB
  }
}
