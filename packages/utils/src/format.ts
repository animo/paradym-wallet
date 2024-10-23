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
  const formatFullDate = (d: Date) =>
    d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  if (days === 0) {
    return includeTime ? `Today at ${formatTime(date)}` : 'Today'
  }
  if (days === 1) {
    return includeTime ? `Yesterday at ${formatTime(date)}` : 'Yesterday'
  }
  if (days > 1 && days <= 7) {
    return `${days} days ago`
  }
  if (days > 7 && days <= 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (days > 30 && days <= 365) {
    const months = Math.floor(days / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }

  return formatFullDate(date)
}

export function formatDate(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
