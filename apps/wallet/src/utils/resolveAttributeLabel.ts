import type { MessageDescriptor } from '@lingui/core'
import { commonMessages, i18n } from '@package/translations'
import type { ResolveAttributeLabel } from '@paradym/wallet-sdk'

/**
 * What the wallet calls well-known claims, for the ones no issuer bothered to name.
 *
 * The credential's own labels win over these — the SDK only reaches for this when the claim
 * metadata says nothing. Lives in the app because it is a naming convention in the user's language,
 * not something a credential contains.
 */
const attributeNameMapping: Record<string, MessageDescriptor> = {
  age_equal_or_over: commonMessages.fields.age_over,
  age_birth_year: commonMessages.fields.birth_year,
  age_in_years: commonMessages.fields.age,
  street_address: commonMessages.fields.street,
  resident_street: commonMessages.fields.street,
  resident_city: commonMessages.fields.city,
  resident_country: commonMessages.fields.country,
  resident_postal_code: commonMessages.fields.postal_code,
  birth_date: commonMessages.fields.date_of_birth,
  birthdate: commonMessages.fields.date_of_birth,
  expiry_date: commonMessages.fields.expires_at,
  issue_date: commonMessages.fields.issued_at,
  issuance_date: commonMessages.fields.issued_at,
  ...commonMessages.fields,
  ...commonMessages.credentials.mdl,
}

export const resolveAttributeLabel: ResolveAttributeLabel = ({ key }) => {
  const messageDescriptor = attributeNameMapping[key]
  if (messageDescriptor) return i18n.t(messageDescriptor)

  if (key.startsWith('age_over_')) {
    return `${i18n.t(commonMessages.fields.age_over)} ${key.replace('age_over_', '')}`
  }

  // Undefined rather than a fallback: the SDK formats the key itself when nothing names it.
  return undefined
}
