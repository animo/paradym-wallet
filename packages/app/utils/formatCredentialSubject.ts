import { sanitizeString } from '@internal/utils'

type CredentialAttributeRow = {
  key: string
  value: string
}

type CredentialAttributeTable = {
  title?: string
  rows: CredentialAttributeRow[]
  depth: number // depth level
  parent?: string // parent name
}

/**
 * Formats the subject of a credential into a tables to display attributes.
 *
 * @param subject the credential subject from a W3C credential.
 * @param depth the current depth of the nested objects within the credential subject. Starts at 0 for the top-level object.
 * @param parent the title of the parent object of the current nested object. Undefined for the top-level object.
 * @param title the title of the current nested object. This corresponds to the key of the nested object within the parent object.
 * @returns an array of CredentialAttributeTable objects, each representing a table with rows of key-value pairs. Nested objects are represented as separate tables.
 */
export function formatCredentialSubject(
  subject: Record<string, unknown>,
  depth = 0,
  parent?: string,
  title?: string
): CredentialAttributeTable[] {
  const stringRows: CredentialAttributeRow[] = []
  const objectTables: CredentialAttributeTable[] = []

  Object.keys(subject).forEach((key) => {
    if (key === 'id' || key === 'type') return // omit id and type

    const value = subject[key]

    if (!value) return // omit properties with no value

    if (typeof value === 'string') {
      stringRows.push({
        key: sanitizeString(key),
        value: value,
      })
      // FIXME: Handle arrays
    } else if (typeof value === 'object' && value !== null) {
      objectTables.push(
        ...formatCredentialSubject(
          value as Record<string, unknown>,
          depth + 1,
          title,
          sanitizeString(key)
        )
      )
    }
  })

  const tableData: CredentialAttributeTable[] = [
    { title, rows: stringRows, depth, parent },
    ...objectTables,
  ]
  return tableData.filter((table) => table.rows.length > 0)
}
