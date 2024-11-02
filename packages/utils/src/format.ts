/**
 * Capitalize first letter of a string
 * i.e. capitalizeFirstLetter("helloworld")  // returns: 'Helloworld'
 */
export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Converts a camelCase string to a sentence format (first letter capitalized, rest in lower case).
 * i.e. sanitizeString("helloWorld")  // returns: 'Hello world'
 */
export function sanitizeString(
  str: string,
  { startWithCapitalLetter = true }: { startWithCapitalLetter?: boolean } = {}
) {
  const result = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ')
  let words = result.split(' ')
  words = words.map((word, index) => {
    if (startWithCapitalLetter && (index === 0 || word.toUpperCase() === word)) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    return word.charAt(0).toLowerCase() + word.slice(1)
  })
  return words.join(' ')
}

/**
 * Formats a date to a relative string like 'today', 'yesterday', or 'x days ago'.
 * @param date The date to format
 * @param now Optional reference date (defaults to current date)
 * @returns A string representation of the relative time
 */
export function formatRelativeDate(date: Date, now: Date = new Date(), includeTime = false): string {
  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.round((now.getTime() - date.getTime()) / msPerDay)

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })

  if (days === 0) {
    return includeTime ? `Today at ${formatTime(date)}` : 'Today'
  }
  if (days === 1) {
    return includeTime ? `Yesterday at ${formatTime(date)}` : 'Yesterday'
  }
  return `${
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
    (date.getDate() === 1 || date.getDate() === 21 || date.getDate() === 31
      ? 'st'
      : date.getDate() === 2 || date.getDate() === 22
        ? 'nd'
        : date.getDate() === 3 || date.getDate() === 23
          ? 'rd'
          : 'th')
  } ${includeTime ? `at ${formatTime(date)}` : ''}`
}

/**
 * very simple matcher for `yyyy-mm-dd`
 */
export function isDateString(value: string) {
  // We do the length check first to avoid unnecesary regex
  return value.length === 'yyyy-mm-dd'.length && value.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
}

export function formatDate(input: string | Date, options?: { includeTime?: boolean }): string {
  const date = input instanceof Date ? input : new Date(input)

  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0
  const includeTime = options?.includeTime ?? hasTime

  const timeOptions = includeTime
    ? ({
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h24',
      } as const)
    : {}

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...timeOptions,
  })
}
