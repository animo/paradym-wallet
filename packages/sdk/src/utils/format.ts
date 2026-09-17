import { getLocale } from '../config/locale'

const getLocaleForFormat = () => getLocale()

/**
 * `Intl.DateTimeFormat` instances, keyed by the locale and options they were built with.
 *
 * Building one is by far the expensive part of formatting a date — `toLocaleString(locale, options)`
 * builds a fresh one on every call, and the wallet force-polyfills `Intl.Locale`, so it does not
 * even get the engine's native implementation. Credentials are full of dates (an mDL carries an
 * issue and expiry date per driving privilege on top of its own), and every one of them is
 * formatted each time a credential's attributes are derived.
 */
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>()

export function getDateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`

  let format = dateTimeFormatCache.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options)
    dateTimeFormatCache.set(key, format)
  }

  return format
}

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
/**
 * What `toLocaleString` returns for a date that is not a date, and what these returned before the
 * formatters above were cached — `Intl.DateTimeFormat.prototype.format` throws a RangeError where
 * `Date.prototype.toLocaleString` does not.
 */
const invalidDate = 'Invalid Date'

/**
 * Reports a date that could not be read, and returns what to render in its place.
 *
 * A Date does not keep the value it was built from: an unparseable string leaves NaN behind and
 * nothing else. So the input can only be named while it is still a string — by the time an mdoc has
 * handed over a Date holding NaN, there is nothing left to report but that it happened.
 */
export function reportInvalidDate(input: string | Date, source: string): string {
  const described =
    typeof input === 'string'
      ? JSON.stringify(input)
      : 'a Date holding NaN — a Date does not keep the value it was constructed from'

  console.warn(`[date] ${source} could not read a date: ${described}`)

  return invalidDate
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
  if (Number.isNaN(date.getTime())) return reportInvalidDate(input, 'formatDate')

  const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0
  const includeTime = options?.includeTime ?? hasTime

  const timeOptions = includeTime
    ? ({
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h24',
      } as const)
    : {}

  return getDateTimeFormat(getLocaleForFormat(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...timeOptions,
  }).format(date)
}

export function isLikelyDate(value: string): boolean {
  const datePatterns = [
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i,
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}/i,
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{1,2}-\d{1,2}-\d{4}$/,
  ]
  return datePatterns.some((pattern) => pattern.test(value))
}
