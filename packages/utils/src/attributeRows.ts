export type AttributeCell = { name: string; isMissing: boolean }

/** Two attribute names to a row. */
function toRows(cells: AttributeCell[]) {
  const rows: Array<[AttributeCell, AttributeCell | undefined]> = []
  for (let index = 0; index < cells.length; index += 2) {
    rows.push([cells[index], cells[index + 1]])
  }
  return rows
}

/**
 * The two columns of attribute names a card lists: what the card holds first, then what it lacks,
 * each group starting on a row of its own.
 */
export function toAttributeRows(names: string[], missingNames?: string[]) {
  const isMissing = (name: string) => missingNames?.includes(name) ?? false

  return [
    ...toRows(names.filter((name) => !isMissing(name)).map((name) => ({ name, isMissing: false }))),
    ...toRows(names.filter(isMissing).map((name) => ({ name, isMissing: true }))),
  ]
}
