// Deep imports: the credential request UI renders this too, and its bundle is separate from the
// app's — the `@package/ui` barrel would pull in the whole kit.
import { useLingui } from '@lingui/react/macro'
import { Heading } from '@package/ui/base/Headings'
import { Paragraph } from '@package/ui/base/Paragraph'
import { XStack, YStack } from '@package/ui/base/Stacks'
import { HeroIcons } from '@package/ui/content/Icon'
import { Image } from '@package/ui/content/Image'
import type { FormattedTransactionDataPaymentSingle } from '@paradym/wallet-sdk/openid4vc/transaction'
import type { FormattedTransactionDataPasoPayment } from '@paradym/wallet-sdk/paso/transactionData'
import type { ReactNode } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Circle } from 'tamagui'

/**
 * The payment itself: amount, payee and the PaSO security hint, in the rulebook's claim order.
 *
 * Everything PaSO requires to have been displayed is in here, so `onLayout` measures it as one block
 * for {@link import('../useTransactionDataSeen').useTransactionDataSeen}.
 */
export function PaymentTransactionDetails({
  transaction,
  onLayout,
  compact = false,
  children,
}: {
  transaction: FormattedTransactionDataPasoPayment | FormattedTransactionDataPaymentSingle
  onLayout?: (event: LayoutChangeEvent) => void
  /** Amount and payee on one row, for the credential request UI's small sheet. */
  compact?: boolean
  /** Shown in the same box, under the payment, when `compact`: the card that pays. */
  children?: ReactNode
}) {
  const { t, i18n } = useLingui()

  // The Attestation Provider's labels normally name these claims, in the locale the proof reports.
  // The fallbacks are for TS 12, and for PaSO without a card and so without metadata to read them from.
  const amountFallbackLabel = t({
    id: 'paso.payment.amountLabel',
    message: 'Amount',
    comment: 'Label above the amount of a payment, when the card supplies no label of its own',
  })
  const payeeFallbackLabel = t({
    id: 'paso.payment.payeeLabel',
    message: 'Payee',
    comment: 'Label above the payee of a payment, when the card supplies no label of its own',
  })

  const details =
    transaction.type === 'urn:eudi:sca:eu.europa.ec:payment:single:1'
      ? {
          amount: { value: transaction.amount, label: undefined },
          payee: { value: transaction.payee.name, label: undefined },
          payeeLogo: transaction.payee.logo ? { url: transaction.payee.logo, label: undefined } : undefined,
          securityHint: undefined,
        }
      : {
          amount: transaction.amount,
          payee: transaction.payee,
          payeeLogo: transaction.payeeLogo
            ? { url: transaction.payeeLogo.dataUrl, label: transaction.payeeLogo.label }
            : undefined,
          securityHint: transaction.securityHint,
        }

  const amount = formatAmount(details.amount.value, i18n.locale)

  const payeeLogo = (size: number) =>
    details.payeeLogo && (
      <Circle size={size} borderWidth="1" borderColor="grey-100" bg="white" overflow="hidden">
        <Image
          src={details.payeeLogo.url}
          alt={details.payeeLogo.label ?? payeeFallbackLabel}
          height="100%"
          width="100%"
          contentFit="contain"
        />
      </Circle>
    )

  return (
    <YStack gap="5" onLayout={onLayout}>
      {compact ? (
        // Side by side, still in the rulebook's claim order: amount, payee, payee logo.
        <YStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="3" p="3">
          <XStack gap="3" items="center">
            <YStack flex={1} gap="0-5">
              <Paragraph variant="annotation">{details.amount.label ?? amountFallbackLabel}</Paragraph>
              <Heading heading="h2" textTransform="none" color="grey-800">
                {amount}
              </Heading>
            </YStack>
            <YStack flex={1} gap="0-5">
              <Paragraph variant="annotation">{details.payee.label ?? payeeFallbackLabel}</Paragraph>
              <Heading heading="h3" textTransform="none" color="grey-800">
                {details.payee.value}
              </Heading>
            </YStack>
            {payeeLogo(40)}
          </XStack>
          {children && (
            <YStack borderTopWidth="1" borderColor="grey-200" pt="3">
              {children}
            </YStack>
          )}
        </YStack>
      ) : (
        <>
          <YStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="5" p="5">
            <YStack gap="0-5" items="center">
              <Paragraph variant="annotation">{details.amount.label ?? amountFallbackLabel}</Paragraph>
              <Heading textTransform="none" color="grey-800">
                {amount}
              </Heading>
            </YStack>
          </YStack>

          <XStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="5" p="5" items="center">
            <YStack flex={1} gap="0-5">
              <Paragraph variant="annotation">{details.payee.label ?? payeeFallbackLabel}</Paragraph>
              <Heading heading="h3" textTransform="none" color="grey-800">
                {details.payee.value}
              </Heading>
            </YStack>
            {payeeLogo(60)}
          </XStack>
        </>
      )}

      {/* Shown exactly as the Attestation Provider wrote it. Never translated, never edited. An info,
          not a warning: it is general advice, and the screen keeps warnings for the request itself. */}
      {details.securityHint && (
        <XStack
          rounded="6"
          bg="grey-50"
          borderWidth={1}
          borderColor="grey-200"
          gap="3"
          p={compact ? '3' : '5'}
          items="flex-start"
        >
          <HeroIcons.InformationCircle color="grey-600" size={20} />
          <Paragraph flex={1} variant="sub" size="2" color="grey-700">
            {details.securityHint}
          </Paragraph>
        </XStack>
      )}
    </YStack>
  )
}

/**
 * An ISO currency amount such as `"49.99 EUR"` as the locale writes it: `€49.99`, `49,99 €`. Keeps
 * every decimal it was given, so nothing is rounded away. Anything else is shown as it came.
 */
function formatAmount(value: string, locale: string) {
  const match = /^(\d+(?:\.(\d+))?) ([A-Z]{3})$/.exec(value.trim())
  if (!match) return value

  const [, amount, decimals = '', currency] = match
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals.length,
      maximumFractionDigits: decimals.length,
    }).format(Number(amount))
  } catch {
    return value
  }
}
