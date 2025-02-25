import { sanitizeString } from '@package/utils'

import mdlCodeA from '../../assets/mdl/code-a.png'
import mdlCodeA1 from '../../assets/mdl/code-a1.png'
import mdlCodeA2 from '../../assets/mdl/code-a2.png'
import mdlCodeAM from '../../assets/mdl/code-am.png'
import mdlCodeB from '../../assets/mdl/code-b.png'
import mdlCodeBE from '../../assets/mdl/code-be.png'
import mdlCodeC from '../../assets/mdl/code-c.png'
import mdlCodeC1 from '../../assets/mdl/code-c1.png'
import mdlCodeC1E from '../../assets/mdl/code-c1e.png'
import mdlCodeCE from '../../assets/mdl/code-ce.png'
import mdlCodeD from '../../assets/mdl/code-d.png'
import mdlCodeD1 from '../../assets/mdl/code-d1.png'
import mdlCodeD1E from '../../assets/mdl/code-d1e.png'
import mdlCodeDE from '../../assets/mdl/code-de.png'
import mdlCodeL from '../../assets/mdl/code-l.png'
import mdlCodeT from '../../assets/mdl/code-t.png'

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

export const mapMdlAttributeName = (key: string) => {
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

const drivingCodes = [
  { code: 'AM', icon: mdlCodeAM },
  { code: 'A1', icon: mdlCodeA1 },
  { code: 'A2', icon: mdlCodeA2 },
  { code: 'A', icon: mdlCodeA },
  { code: 'B', icon: mdlCodeB },
  { code: 'C1', icon: mdlCodeC1 },
  { code: 'C', icon: mdlCodeC },
  { code: 'D1', icon: mdlCodeD1 },
  { code: 'D', icon: mdlCodeD },
  { code: 'BE', icon: mdlCodeBE },
  { code: 'C1E', icon: mdlCodeC1E },
  { code: 'CE', icon: mdlCodeCE },
  { code: 'D1E', icon: mdlCodeD1E },
  { code: 'DE', icon: mdlCodeDE },
  { code: 'L', icon: mdlCodeL },
  { code: 'T', icon: mdlCodeT },
]

export function getMdlCode(code: string) {
  const index = drivingCodes.findIndex((entry) => entry.code === code)
  if (index === -1) return { code, index: undefined, icon: undefined }
  return { ...drivingCodes[index], index }
}
