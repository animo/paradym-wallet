import { ClaimFormat } from '@credo-ts/core'
import { getPidAttributesForDisplay } from '@easypid/utils/pidCustomMetadata'
import type { CredentialCategoryMetadata } from '@paradym/wallet-sdk/src/metadata/credentials'

const categoryDisplay = {
  [ClaimFormat.SdJwtVc]: {
    'DE-PID': (attributes: Record<string, unknown>) => {
      return getPidAttributesForDisplay(attributes, ClaimFormat.SdJwtVc)
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
  format: ClaimFormat.SdJwtVc | ClaimFormat.MsoMdoc
  credentialCategory?: CredentialCategoryMetadata['credentialCategory']
  attributes: Record<string, unknown>
}) => {
  return categoryDisplay[format]?.[credentialCategory as keyof (typeof categoryDisplay)[typeof format]]?.(attributes)
}
