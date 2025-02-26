import { sanitizeString } from 'packages/utils/src'

// TODO: Improvements
// - If we have an array, but it's just 1 item, we should just show it directly as an object or value.
// - Sanitize the values does not always go correctly, so i turned it off for now.

/**
 * Formats credential subject data for rendering based on value types
 *
 * @param subject The credential subject to format
 * @returns A structured representation of the data with type information
 */
export type FormattedCredentialValue =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'date'; value: string }
  | { type: 'image'; value: string }
  | { type: 'primitiveArray'; value: (string | number | boolean)[] }
  | { type: 'objectArray'; value: FormattedCredentialItem[] }
  | { type: 'object'; value: Record<string, FormattedCredentialValue> }

export type FormattedCredentialItem = {
  key: string
  value: FormattedCredentialValue
}

export function formatCredentialData(subject: Record<string, unknown>): FormattedCredentialItem[] {
  const result: FormattedCredentialItem[] = []

  for (const [key, value] of Object.entries(subject)) {
    if (value === undefined || value === null) continue

    result.push({
      key: sanitizeString(key),
      value: determineValueType(value, key),
    })
  }

  return result
}

function determineValueType(value: unknown, parentKey?: string): FormattedCredentialValue {
  // Handle image data URLs
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return { type: 'image', value }
  }

  // Handle potential date strings
  if (typeof value === 'string' && isLikelyDate(value)) {
    return { type: 'date', value }
  }

  // Handle primitive types
  if (typeof value === 'string') {
    return { type: 'string', value }
  }

  if (typeof value === 'number') {
    return { type: 'number', value }
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', value }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    // Check if array contains only primitive values
    if (value.every((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
      return {
        type: 'primitiveArray',
        value: value as (string | number | boolean)[],
      }
    }

    // Handle arrays of objects or mixed types
    const formattedArray = value.map((item, index) => {
      // Try to find a meaningful property to use as key (Option 1)
      let itemKey = `${index}`

      if (typeof item === 'object' && item !== null) {
        // Look for a name property first
        if ('name' in item && typeof item.name === 'string') {
          itemKey = item.name
        }
        // Then try id
        else if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
          itemKey = String(item.id)
        }
        // If no meaningful property found, use parent name + index
        else if (parentKey) {
          itemKey = `${sanitizeString(parentKey)} ${index + 1}`
        }
      }

      return {
        key: itemKey,
        value: determineValueType(item, parentKey),
      }
    })

    return { type: 'objectArray', value: formattedArray }
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Special case for image objects
    if ('type' in value && value.type === 'Image' && 'id' in value && typeof value.id === 'string') {
      return { type: 'image', value: value.id as string }
    }

    const formattedObject: Record<string, FormattedCredentialValue> = {}

    for (const [objKey, objValue] of Object.entries(value)) {
      if (objValue !== undefined && objValue !== null) {
        formattedObject[sanitizeString(objKey)] = determineValueType(objValue, objKey)
      }
    }

    return { type: 'object', value: formattedObject }
  }

  // Fallback for any other types
  return { type: 'string', value: String(value) }
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
