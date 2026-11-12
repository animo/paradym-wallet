export type AttributeCell = { name: string; isMissing: boolean }

/** Fewer attribute names than this read better as one column. */
const minimumForTwoColumns = 4

/** `columns` attribute names to a row, the last row padded with `undefined`. */
function toRows(cells: AttributeCell[], columns: number) {
  const rows: Array<Array<AttributeCell | undefined>> = []
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(Array.from({ length: columns }, (_, column) => cells[index + column]))
  }
  return rows
}

/**
 * The columns of attribute names a card lists: what the card holds first, then what it lacks, each
 * group starting on a row of its own. Two columns, or one for a short list.
 */
export function toAttributeRows(names: string[], missingNames?: string[]) {
  const isMissing = (name: string) => missingNames?.includes(name) ?? false
  const columns = names.length < minimumForTwoColumns ? 1 : 2

  return [
    ...toRows(
      names.filter((name) => !isMissing(name)).map((name) => ({ name, isMissing: false })),
      columns
    ),
    ...toRows(
      names.filter(isMissing).map((name) => ({ name, isMissing: true })),
      columns
    ),
  ]
}
