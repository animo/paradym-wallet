import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { Paragraph } from '@package/ui/base/Paragraph'
import { formatAmount } from '@package/utils'
import type { PasoDisplayLabel, PasoDisplayPart, PasoDisplayValue } from '@paradym/wallet-sdk/paso/render'
import type { ComponentProps } from 'react'
import { Text } from 'tamagui'

/**
 * Formats the value types of [PaSO View] Section 3 in the user's language. Every format keeps the
 * value exact: amounts keep every decimal, dates keep their day, a URL is shown in full.
 */

const frequencyMessages = {
  INDA: msg({ id: 'paso.frequency.INDA', message: 'Several times a day', comment: 'PaSO frequency code INDA' }),
  DAIL: msg({ id: 'paso.frequency.DAIL', message: 'Daily', comment: 'PaSO frequency code DAIL' }),
  WEEK: msg({ id: 'paso.frequency.WEEK', message: 'Weekly', comment: 'PaSO frequency code WEEK' }),
  TOWK: msg({ id: 'paso.frequency.TOWK', message: 'Every two weeks', comment: 'PaSO frequency code TOWK' }),
  TWMN: msg({ id: 'paso.frequency.TWMN', message: 'Twice a month', comment: 'PaSO frequency code TWMN' }),
  MNTH: msg({ id: 'paso.frequency.MNTH', message: 'Monthly', comment: 'PaSO frequency code MNTH' }),
  TOMN: msg({ id: 'paso.frequency.TOMN', message: 'Every two months', comment: 'PaSO frequency code TOMN' }),
  QUTR: msg({ id: 'paso.frequency.QUTR', message: 'Quarterly', comment: 'PaSO frequency code QUTR' }),
  FOMN: msg({ id: 'paso.frequency.FOMN', message: 'Every four months', comment: 'PaSO frequency code FOMN' }),
  SEMI: msg({ id: 'paso.frequency.SEMI', message: 'Twice a year', comment: 'PaSO frequency code SEMI' }),
  YEAR: msg({ id: 'paso.frequency.YEAR', message: 'Yearly', comment: 'PaSO frequency code YEAR' }),
  TYEA: msg({ id: 'paso.frequency.TYEA', message: 'Every two years', comment: 'PaSO frequency code TYEA' }),
}

/** A date written as its own calendar day, so no time zone can move it to the day before. */
function formatIsoDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date
  )
}

/** In the device's time zone, with the zone named so the moment can't be misread. */
function formatIsoDateTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

/**
 * The full URL, with an internationalised host name in its punycode form so a look-alike domain
 * can't pass for the real one ([PaSO View] Section 3).
 */
function formatUrl(value: string) {
  try {
    return new URL(value).href
  } catch {
    return value
  }
}

export function usePasoValueFormatter() {
  const { t, i18n } = useLingui()

  return (value: Exclude<PasoDisplayPart, string>): string => {
    switch (value.type) {
      case 'text':
      case 'mini_markdown':
      case 'iso_time':
      case 'iso_currency':
        return value.value
      case 'boolean':
        return value.value
          ? t({ id: 'paso.value.yes', message: 'Yes', comment: 'A PaSO yes/no value that is true' })
          : t({ id: 'paso.value.no', message: 'No', comment: 'A PaSO yes/no value that is false' })
      case 'frequency':
        return t(frequencyMessages[value.value as keyof typeof frequencyMessages])
      case 'iso_date':
        return formatIsoDate(value.value, i18n.locale)
      case 'iso_date_time':
        return formatIsoDateTime(value.value, i18n.locale)
      case 'iso_currency_amount':
        return formatAmount(value.value, i18n.locale)
      case 'url':
        return formatUrl(value.value)
    }
  }
}

type ParagraphProps = ComponentProps<typeof Paragraph>

/**
 * [PaSO View] Section 3 `mini_markdown`: emphasis, strong emphasis and `<u>` underline are rendered,
 * every other construct stays literal text.
 */
function MiniMarkdownSpans({ text }: { text: string }) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|<u>[^<]+<\/u>|\*[^*]+\*|_[^_]+_)/g
  return text.split(pattern).map((segment, index) => {
    const key = `${index}-${segment}`
    if (/^(\*\*|__).+\1$/.test(segment)) {
      return (
        <Text key={key} fontWeight="semiBold">
          {segment.slice(2, -2)}
        </Text>
      )
    }
    if (/^<u>.+<\/u>$/.test(segment)) {
      return (
        <Text key={key} textDecorationLine="underline">
          {segment.slice(3, -4)}
        </Text>
      )
    }
    if (/^(\*|_).+\1$/.test(segment)) {
      return (
        <Text key={key} fontStyle="italic">
          {segment.slice(1, -1)}
        </Text>
      )
    }
    return segment
  })
}

function PartsText({ parts, markdown }: { parts: PasoDisplayPart[]; markdown: boolean }) {
  const format = usePasoValueFormatter()
  const text = parts.map((part) => (typeof part === 'string' ? part : format(part))).join('')
  return markdown ? <MiniMarkdownSpans text={text} /> : text
}

export function PasoLabelText({ label, ...props }: { label: PasoDisplayLabel } & ParagraphProps) {
  return (
    <Paragraph variant="annotation" {...props}>
      <PartsText parts={label.parts} markdown={label.markdown} />
    </Paragraph>
  )
}

/** A non-image value, as text that wraps and is never shortened. */
export function PasoValueText({
  value,
  ...props
}: { value: Exclude<PasoDisplayValue, { type: 'image' }> } & ParagraphProps) {
  const format = usePasoValueFormatter()

  if (value.type === 'template') {
    return (
      <Paragraph color="grey-800" fontWeight="semiBold" {...props}>
        <PartsText parts={value.parts} markdown={value.markdown} />
      </Paragraph>
    )
  }

  return (
    <Paragraph
      color="grey-800"
      fontWeight={value.type === 'mini_markdown' ? undefined : 'semiBold'}
      // A URL is shown character for character, so a look-alike stands out ([PaSO View] Section 3).
      fontFamily={value.type === 'url' ? 'monospace' : undefined}
      {...props}
    >
      {value.type === 'mini_markdown' ? <MiniMarkdownSpans text={value.value} /> : format(value)}
    </Paragraph>
  )
}
