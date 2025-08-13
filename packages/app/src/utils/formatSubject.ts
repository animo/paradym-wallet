import type { MessageDescriptor } from '@lingui/core'
import { commonMessages, i18n } from '@package/translations'
import { sanitizeString } from '@package/utils'

// TODO: move to a more common place, make it less brittle
export const attributeNameMapping: Record<string, MessageDescriptor> = {
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

export const mapAttributeName = (key: string) => {
  const messageDescriptor = attributeNameMapping[key]
  if (messageDescriptor) return i18n.t(messageDescriptor)

  if (key.startsWith('age_over_')) {
    return `${i18n.t(commonMessages.fields.age_over)} ${key.replace('age_over_', '')}`
  }

  return sanitizeString(key)
}

type BaseFormattedCredentialValue = { key: string; name: string | number }

export type FormattedCredentialValueString = BaseFormattedCredentialValue & { type: 'string'; value: string }
export type FormattedCredentialValueNumber = BaseFormattedCredentialValue & { type: 'number'; value: number }
export type FormattedCredentialValueBoolean = BaseFormattedCredentialValue & { type: 'boolean'; value: boolean }
export type FormattedCredentialValueDate = BaseFormattedCredentialValue & { type: 'date'; value: string }
export type FormattedCredentialValueImage = BaseFormattedCredentialValue & { type: 'image'; value: string }
export type FormattedCredentialValueArray = BaseFormattedCredentialValue & {
  type: 'array'
  value: FormattedCredentialValue[]
}
export type FormattedCredentialValueObject = BaseFormattedCredentialValue & {
  type: 'object'
  value: FormattedCredentialValue[]
}

/**
 * Formats credential subject data for rendering based on value types
 *
 * @param subject The credential subject to format
 * @returns A structured representation of the data with type information
 */
export type FormattedCredentialValue =
  | FormattedCredentialValueString
  | FormattedCredentialValueNumber
  | FormattedCredentialValueBoolean
  | FormattedCredentialValueDate
  | FormattedCredentialValueImage
  | FormattedCredentialValueArray
  | FormattedCredentialValueObject

export function formatCredentialData(subject: Record<string, unknown>): FormattedCredentialValue[] {
  const result: FormattedCredentialValue[] = []

  for (const [key, value] of Object.entries(subject)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) continue

    result.push(determineValueType(key, value))
  }

  return result
}

function determineValueType(key: string | number, value: unknown, parentKey?: string): FormattedCredentialValue {
  const name = typeof key === 'number' ? key : mapAttributeName(key)
  const _key = parentKey ? `${parentKey}-${key}` : `${key}`

  // Handle image data URLs
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return { key: _key, name, type: 'image', value }
  }

  // Handle potential date strings
  if (typeof value === 'string' && isLikelyDate(value)) {
    return { key: _key, name, type: 'date', value }
  }

  // Handle primitive types
  if (typeof value === 'string') {
    return { key: _key, name, type: 'string', value }
  }

  if (typeof value === 'number') {
    return { key: _key, name, type: 'number', value }
  }

  if (typeof value === 'boolean') {
    return { key: _key, name, type: 'boolean', value }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    // If array has only one item, process it directly
    if (value.length === 1) {
      return determineValueType(key, value[0], parentKey)
    }

    // Handle arrays of objects or mixed types
    const formattedArray = value.map((item, index) => determineValueType(index, item, parentKey))

    return { key: _key, name, type: 'array', value: formattedArray }
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Special case for image objects
    if ('type' in value && value.type === 'Image' && 'id' in value && typeof value.id === 'string') {
      return { key: _key, name, type: 'image', value: value.id as string }
    }

    const formattedEntries: FormattedCredentialValue[] = []
    const objectEntries = Object.entries(value)

    if (objectEntries.length === 1) {
      const [key, value] = objectEntries[0]

      const valueType = determineValueType(key, value, parentKey)
      return {
        ...valueType,
        name: typeof name === 'number' ? valueType.name : `${name} → ${valueType.name}`,
      }
    }

    for (const [objKey, objValue] of objectEntries) {
      if (objValue !== undefined && objValue !== null) {
        formattedEntries.push(determineValueType(objKey, objValue, parentKey))
      }
    }

    return { key: _key, name, type: 'object', value: formattedEntries }
  }

  // Fallback for any other types
  return { key: _key, name, type: 'string', value: String(value) }
}

/**
 * Checks if a string is likely to be a date
 */
function isLikelyDate(value: string): boolean {
  // Check for common date patterns
  const datePatterns = [
    // Match "Month Day, Year" format
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i,
    // Match "Month Day, Year at HH:MM" format
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}/i,
    // ISO date format
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
    // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/,
  ]

  return datePatterns.some((pattern) => pattern.test(value))
}
