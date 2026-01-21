import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'

export function sanitizeString(
  str: string | AnonCredsRequestedPredicate,
  { startWithCapitalLetter = true }: { startWithCapitalLetter?: boolean } = {}
) {
  if (typeof str === 'object') return str
  const result = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace('_', ' ')
  let words = result.split(' ')
  words = words.map((word, index) => {
    if (startWithCapitalLetter && (index === 0 || word.toUpperCase() === word)) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    return word.charAt(0).toLowerCase() + word.slice(1)
  })
  return words.join(' ')
}
