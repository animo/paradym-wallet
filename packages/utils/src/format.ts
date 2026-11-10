import { t } from '@lingui/core/macro'

export {
  capitalizeFirstLetter,
  formatDate,
  isDateString,
  isLikelyDate,
  sanitizeString,
} from '@paradym/wallet-sdk/utils/format'

// The same formatter cache and invalid-date reporting the SDK uses, so there is one of each rather
// than a second set built here.
import { getDateTimeFormat, reportInvalidDate } from '@paradym/wallet-sdk/utils/format'

/**
 * `locale` is the active one, from `useLingui`: as an argument, a memoised caller (React Compiler) formats
 * the date again when the language changes.
 */
export function formatRelativeDate(date: Date, locale: string, includeTime = false): string {
  if (Number.isNaN(date.getTime())) return reportInvalidDate(date, 'formatRelativeDate')

  const now = new Date()
  // Calendar days, so 23:00 yesterday is yesterday at 01:00 today
  const startOfDay = (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000))

  const formatTime = (d: Date) =>
    getDateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: false }).format(d)

  if (days === 0) {
    return includeTime
      ? t({ id: 'dateFormatting.todayAtTime', message: `Today at ${formatTime(date)}` })
      : t({ id: 'dateFormatting.today', message: 'Today' })
  }
  if (days === 1) {
    return includeTime
      ? t({ id: 'dateFormatting.yesterdayAtTime', message: `Yesterday at ${formatTime(date)}` })
      : t({ id: 'dateFormatting.yesterday', message: 'Yesterday' })
  }

  const year = date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  const day = getDateTimeFormat(locale, { month: 'long', day: 'numeric', year }).format(date)
  if (!includeTime) return day

  const time = formatTime(date)
  return t({
    id: 'dateFormatting.dateAtTime',
    message: `${day} at ${time}`,
    comment:
      'A date and a time, such as "November 10 at 14:30". The date is formatted already, with or without the year',
  })
}

export function getDaysUntil(date?: Date): number | undefined {
  if (!date) return undefined
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function formatDaysString(days?: number): string | undefined {
  if (days === undefined) return undefined

  return days === 1
    ? t({
        id: 'dateFormatting.oneDay',
        message: '1 day',
      })
    : t({
        id: 'dateFormatting.mulitpleDays',
        message: `${days} days`,
      })
}
