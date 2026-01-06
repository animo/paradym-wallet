import mdlCodeA from '../../assets/mdl/code_a.png'
import mdlCodeA1 from '../../assets/mdl/code_a1.png'
import mdlCodeA2 from '../../assets/mdl/code_a2.png'
import mdlCodeAM from '../../assets/mdl/code_am.png'
import mdlCodeB from '../../assets/mdl/code_b.png'
import mdlCodeBE from '../../assets/mdl/code_be.png'
import mdlCodeC from '../../assets/mdl/code_c.png'
import mdlCodeC1 from '../../assets/mdl/code_c1.png'
import mdlCodeC1E from '../../assets/mdl/code_c1e.png'
import mdlCodeCE from '../../assets/mdl/code_ce.png'
import mdlCodeD from '../../assets/mdl/code_d.png'
import mdlCodeD1 from '../../assets/mdl/code_d1.png'
import mdlCodeD1E from '../../assets/mdl/code_d1e.png'
import mdlCodeDE from '../../assets/mdl/code_de.png'
import mdlCodeL from '../../assets/mdl/code_l.png'
import mdlCodeT from '../../assets/mdl/code_t.png'

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
