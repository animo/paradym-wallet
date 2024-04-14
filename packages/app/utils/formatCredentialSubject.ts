import { sanitizeString } from '@internal/utils'

export type CredentialAttributeRowString = {
  key: string
  value: string
  type: 'string'
}

export type CredentialAttributeRowImage = {
  type: 'image'
  key: string
  image: string
}

export type CredentialAttributeRowImageAndString = {
  type: 'imageAndString'
  key: string
  image: string
  value: string
}

type CredentialAttributeRow =
  | CredentialAttributeRowString
  | CredentialAttributeRowImage
  | CredentialAttributeRowImageAndString

export type CredentialAttributeTable = {
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

  for (const key of Object.keys(subject)) {
    // omit id and type
    if (key === 'id' || key === 'type') continue

    const value = subject[key]

    // omit properties with no value
    if (value === undefined) continue

    if (typeof value === 'string' && value.startsWith('data:image/')) {
      stringRows.push({
        key: sanitizeString(key),
        image: value,
        type: 'image',
      })
    } else if (typeof value === 'string' || typeof value === 'number') {
      stringRows.push({
        key: sanitizeString(key),
        value: `${value}`,
        type: 'string',
      })
    } else if (typeof value === 'boolean') {
      stringRows.push({
        key: sanitizeString(key),
        value: value ? 'Yes' : 'No',
        type: 'string',
      })
    }
    // FIXME: Handle arrays
    else if (typeof value === 'object' && value !== null) {
      // Special handling for image
      if ('type' in value && value.type === 'Image') {
        if ('id' in value && typeof value.id === 'string') {
          stringRows.push({
            key: sanitizeString(key),
            image: value.id,
            type: 'image',
          })
        }
      } else {
        objectTables.push(
          ...formatCredentialSubject(
            value as Record<string, unknown>,
            depth + 1,
            title,
            sanitizeString(key)
          )
        )
      }
    }
  }

  const tableData: CredentialAttributeTable[] = [
    { title, rows: stringRows, depth, parent },
    ...objectTables,
  ]

  return tableData
    .filter((table) => table.rows.length > 0)
    .map((table) => {
      const firstImageIndex = table.rows.findIndex((row) => row.type === 'image')
      const firstStringIndex = table.rows.findIndex((row) => row.type === 'string')
      let rows = table.rows

      // This does some fancy logic to combine the first string value and the first image value
      // into a combined imageAndString row. When only a single image is present in in an object,
      // this will make it look relatively nice, without needing to know the exact structure of
      // the credential.
      if (
        firstImageIndex !== -1 &&
        firstStringIndex !== -1 &&
        // Due to recursive call, it could be that the rows already contain a combined row
        table.rows[0]?.type !== 'imageAndString'
      ) {
        const stringRow = table.rows[firstStringIndex] as CredentialAttributeRowString
        const imageRow = table.rows[firstImageIndex] as CredentialAttributeRowImage

        const imageAndStringRow = {
          type: 'imageAndString',
          image: imageRow.image,
          key: stringRow.key,
          value: stringRow.value,
        } satisfies CredentialAttributeRowImageAndString

        // Remove the image and string rows and replace with the combined row
        rows = [
          imageAndStringRow,
          ...table.rows.filter((row) => row !== imageRow && row !== stringRow),
        ]
      }

      rows = rows.sort((a, b) => {
        const order = ['imageAndString', 'string', 'image']
        return order.indexOf(a.type) - order.indexOf(b.type)
      })

      return {
        ...table,
        // Sort the rows so that imageAndString rows are first, followed by string rows, followed by image rows
        rows: rows.sort((a, b) => {
          const order = ['imageAndString', 'string', 'image']
          return order.indexOf(a.type) - order.indexOf(b.type)
        }),
      }
    })
}
