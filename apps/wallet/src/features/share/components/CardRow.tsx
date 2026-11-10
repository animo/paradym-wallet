// Deep imports: the credential request UI renders this too, and its bundle is separate from the
// app's — the `@package/ui` barrel would pull in the whole kit.
import { defineMessage, plural } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { MiniCardRowItem } from '@package/ui/components/MiniCardRowItem'
import type { FormattedSubmissionEntrySatisfiedCredential } from '@paradym/wallet-sdk'
import type { ReactNode } from 'react'

/**
 * `accessory` sits at the end of the line under the card, so the card name keeps the full width.
 * `artwork` is the card's rendered SVG template: the app and the credential request UI draw it
 * differently, so they pass it in.
 */
export function CardRow({
  card,
  accessory,
  artwork,
  compact,
}: {
  card: FormattedSubmissionEntrySatisfiedCredential
  accessory?: ReactNode
  artwork?: ReactNode
  compact?: boolean
}) {
  const { t } = useLingui()
  const detail = useCardDetail()(card)

  return (
    <YStack gap="2" flex={1}>
      <MiniCardRowItem
        name={card.credential.display.name ?? t(commonMessages.unknown)}
        backgroundImageUri={card.credential.display.backgroundImage?.url}
        backgroundColor={card.credential.display.backgroundColor ?? 'white'}
        issuerImageUri={card.credential.display.issuer.logo?.url}
        subtitle={card.credential.display.issuer.name ?? t(commonMessages.unknown)}
        artwork={artwork}
        compact={compact}
      />
      {(detail || accessory) && (
        <XStack items="center" justify="space-between" gap="2">
          <Paragraph variant="sub" color="grey-700" flexShrink={1} numberOfLines={1}>
            {detail ?? ''}
          </Paragraph>
          {accessory}
        </XStack>
      )}
    </YStack>
  )
}

/**
 * The line that tells a card apart from others of its type. WPA Rulebook Section 4.2: the masked IBAN
 * is how the payer tells their payment cards apart, one per account. Other cards are told apart by when
 * they were issued.
 */
export function useCardDetail() {
  const { t, i18n } = useLingui()

  return (card: FormattedSubmissionEntrySatisfiedCredential) => {
    const maskedIban = card.credential.rawAttributes.masked_iban
    if (typeof maskedIban === 'string') return maskedIban

    const { issuedAt } = card.credential.metadata
    const issued = issuedAt ? issuedMessage(new Date(issuedAt), i18n.locale) : undefined
    return issued ? t(issued) : undefined
  }
}

/**
 * When a card was issued: today, yesterday, 3 days ago or 2 weeks ago up to four weeks, its date
 * after that, without the year in the current year. In words rather than with
 * `Intl.RelativeTimeFormat`, which Hermes doesn't have.
 */
function issuedMessage(date: Date, locale: string) {
  if (Number.isNaN(date.getTime())) return undefined

  const now = new Date()
  const startOfDay = (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000))

  if (days === 0) return issuedMessages.today
  if (days === 1) return issuedMessages.yesterday
  if (days > 1 && days < 7) return issuedMessages.daysAgo(days)
  if (days >= 7 && days < 28) return issuedMessages.weeksAgo(Math.floor(days / 7))

  const year = date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  return issuedMessages.on(new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year }).format(date))
}

const issuedMessages = {
  today: defineMessage({ id: 'common.issuedToday', message: 'Issued today', comment: 'When a credential was issued' }),
  yesterday: defineMessage({
    id: 'common.issuedYesterday',
    message: 'Issued yesterday',
    comment: 'When a credential was issued',
  }),
  daysAgo: (days: number) =>
    defineMessage({
      id: 'common.issuedDaysAgo',
      message: plural(days, { one: 'Issued # day ago', other: 'Issued # days ago' }),
      comment: 'When a credential was issued, between 2 and 6 days ago',
    }),
  weeksAgo: (weeks: number) =>
    defineMessage({
      id: 'common.issuedWeeksAgo',
      message: plural(weeks, { one: 'Issued # week ago', other: 'Issued # weeks ago' }),
      comment: 'When a credential was issued, between 1 and 3 weeks ago',
    }),
  on: (date: string) =>
    defineMessage({
      id: 'common.issuedOnDate',
      message: `Issued on ${date}`,
      comment:
        'When a credential was issued, more than four weeks ago. The date is formatted already, with or without the year',
    }),
}
