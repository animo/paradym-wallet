import { t } from '@lingui/core/macro'
import { i18n } from '@package/translations'

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

const getLocaleForFormat = () => i18n.locale ?? 'en-US'

export function formatRelativeDate(date: Date, now: Date = new Date(), includeTime = false): string {
  if (Number.isNaN(date.getTime())) return reportInvalidDate(date, 'formatRelativeDate')

  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.round((now.getTime() - date.getTime()) / msPerDay)

  const formatTime = (d: Date) =>
    getDateTimeFormat(getLocaleForFormat(), { hour: 'numeric', minute: '2-digit', hour12: false }).format(d)

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
  return `${getDateTimeFormat(getLocaleForFormat(), {
    month: 'long',
    day: 'numeric',
  }).format(date)} ${includeTime ? `at ${formatTime(date)}` : ''}`
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
