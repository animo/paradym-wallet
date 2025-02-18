import { sanitizeString } from '@package/utils'

import mdlCodeA from '../../assets/mdl/code-a.png'
import mdlCodeB from '../../assets/mdl/code-b.png'
import mdlCodeC from '../../assets/mdl/code-c.png'
import mdlCodeC1 from '../../assets/mdl/code-c1.png'
import mdlCodeD from '../../assets/mdl/code-d.png'
import mdlCodeD1 from '../../assets/mdl/code-d1.png'

type DrivingPrivilege = {
  codes: string[]
  expiry_date: string
  issue_date: string
  vehicle_category_code: string
}

export type MdlAttributes = {
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
  codes: 'Codes',
  code: 'Code',
  vehicle_category_code: 'Vehicle category code',
} as Record<string, string>

export const mapMdlAttributeName = (key: string) => {
  return attributeNameMapping[key] ?? sanitizeString(key)
}

export function getMdlAttributesForDisplay(attributes: Partial<MdlAttributes>) {
  const attributeGroups: Array<[string, unknown]> = []

  const { driving_privileges, ...remainingAttributes } = attributes

  // Filter out any age_over_XX attributes from remainingAttributes
  const filteredAttributes = Object.entries(remainingAttributes).filter(([key]) => !key.startsWith('age_over_'))

  if (driving_privileges) {
    attributeGroups.push([
      'Driving privileges',
      Object.fromEntries(Object.entries(driving_privileges).map(([key, value]) => [mapMdlAttributeName(key), value])),
    ])
  }

  return Object.fromEntries([
    ...Object.entries(filteredAttributes).map(([key, value]) => [mapMdlAttributeName(key), value]),
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
