import { ClaimFormat } from '@credo-ts/core'
import { getPidAttributesForDisplay } from '@easypid/utils/pidCustomMetadata'
import type { CredentialCategoryMetadata } from '../credentialCategoryMetadata'

const categoryDisplay = {
  [ClaimFormat.SdJwtDc]: {
    'DE-PID': (attributes: Record<string, unknown>) => {
      return getPidAttributesForDisplay(attributes, ClaimFormat.SdJwtDc)
    },
  },
  [ClaimFormat.MsoMdoc]: {
    'DE-PID': (attributes: Record<string, unknown>) => {
      return getPidAttributesForDisplay(attributes, ClaimFormat.MsoMdoc)
    },
  },
}

export const getAttributesForCategory = ({
  format,
  credentialCategory,
  attributes,
}: {
  format: ClaimFormat.SdJwtDc | ClaimFormat.MsoMdoc
  credentialCategory?: CredentialCategoryMetadata['credentialCategory']
  attributes: Record<string, unknown>
}) => {
  return categoryDisplay[format]?.[credentialCategory as keyof (typeof categoryDisplay)[typeof format]]?.(attributes)
}
