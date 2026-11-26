import { useLingui } from '@lingui/react/macro'
import {
  Button,
  Circle,
  Heading,
  HeroIcons,
  Image,
  Paragraph,
  useIsAccessibilityTextSize,
  XStack,
  YStack,
} from '@package/ui'
import { formatAmount } from '@package/utils'
import type {
  FormattedSubmissionEntrySatisfiedCredential,
  FormattedTransactionDataPaso,
  PasoDisplayItem,
  PasoPaymentDisplay,
} from '@paradym/wallet-sdk'
import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { CardRow } from './CardRow'
import { PasoLabelText, PasoValueText } from './PasoValue'
import { PayingAccount } from './PayingAccount'

/**
 * The issuer's part of a PaSO consent screen, laid out by the WPA Rulebook v1.1 Section 4.7.2
 * hierarchy: title (L1), amount (L2), payee (L3), payee logo (L4), paying account (L5) and security
 * hint (L6). Any other transaction type shows its claims in L2–L4's place.
 *
 * Everything inside the frame comes from the issuer or the Relying Party, and the wallet draws the
 * "From <issuer>" chip on its border, outside anything they control. So text that imitates the
 * wallet, like a "verified" line in the security hint, still reads as the issuer's ([PaSO View]
 * Section 5.4). The wallet puts none of its own marks inside.
 */
export function PasoTransactionFrame({
  transaction,
  card,
  issuer,
  accountAction,
  artwork,
}: {
  transaction: FormattedTransactionDataPaso
  card?: FormattedSubmissionEntrySatisfiedCredential
  issuer: { name: string; logoUrl?: string }
  /** The control to pick another paying account, when more than one card matches. */
  accountAction?: ReactNode
  artwork?: ReactNode
}) {
  const { t } = useLingui()
  const { fontScale } = useWindowDimensions()
  const isAccessibilityTextSize = useIsAccessibilityTextSize()
  // The logo grows with the name next to it, up to twice its size
  const logoSize = Math.round(18 * Math.min(Math.max(fontScale, 1), 2))

  return (
    <YStack>
      {/* In the layout flow, so a chip that wraps pushes the frame down instead of covering the title.
          A name that wraps at accessibility text sizes gets a box rather than a pill. */}
      <XStack
        alignSelf="flex-start"
        z={1}
        mb={-12}
        ml="3"
        maxWidth="90%"
        items="center"
        gap={isAccessibilityTextSize ? '2' : '1.5'}
        bg="background"
        borderWidth={1}
        borderColor="grey-200"
        rounded={isAccessibilityTextSize ? '6' : '12'}
        pl={isAccessibilityTextSize ? '2' : '1'}
        pr={isAccessibilityTextSize ? '3' : '2.5'}
        py={isAccessibilityTextSize ? '1.5' : '0.5'}
      >
        {issuer.logoUrl && (
          <Circle size={logoSize} overflow="hidden" bg="white">
            <Image src={issuer.logoUrl} width="100%" height="100%" contentFit="contain" />
          </Circle>
        )}
        <Paragraph variant="annotation" fontWeight="semiBold" color="grey-600" flexShrink={1}>
          {t({
            id: 'paso.frame.from',
            message: `From ${issuer.name}`,
            comment:
              'Shown on the border of the box with everything the bank or the requester wrote on a payment screen',
          })}
        </Paragraph>
      </XStack>

      <YStack bg="grey-50" borderWidth={1} borderColor="grey-100" rounded="6" px="4" pt="6" pb="4" gap="4">
        {transaction.transactionTitle && <Heading heading="h2">{transaction.transactionTitle}</Heading>}

        {transaction.type === 'paso_claims' ? (
          <YStack gap="4">
            {transaction.items.map((item) => (
              <PasoItem key={item.path.join('.')} item={item} />
            ))}
          </YStack>
        ) : (
          <PaymentLevels payment={transaction} />
        )}

        {card && (
          <>
            <Divider />
            <PayingAccount label={transaction.paymentAccountLabel} action={accountAction}>
              <CardRow card={card} artwork={artwork} wrap />
            </PayingAccount>
          </>
        )}

        {/* Shown exactly as the Attestation Provider wrote it ([PaSO Proof Metadata] Section 3.2). */}
        {transaction.securityHint && (
          <>
            <Divider />
            <Paragraph color="grey-700">{transaction.securityHint}</Paragraph>
          </>
        )}
      </YStack>
    </YStack>
  )
}

function Divider() {
  return <YStack borderTopWidth={1} borderColor="grey-200" />
}

/** L2–L4: amount and currency together and never rounded, then the payee, then its logo. */
function PaymentLevels({ payment, compact }: { payment: PasoPaymentDisplay; compact?: boolean }) {
  const { t, i18n } = useLingui()
  const amount = formatAmount(payment.amount.value, i18n.locale)

  return (
    <YStack gap="3">
      <YStack gap="0.5">
        <Paragraph variant="annotation">
          {payment.amount.label ??
            t({
              id: 'paso.payment.amountLabel',
              message: 'Amount',
              comment: 'Label above the amount of a payment, when the card supplies no label of its own',
            })}
        </Paragraph>
        {/* Steps down rather than wrapping a long amount: it may not be shortened or abbreviated. */}
        <Heading
          textTransform="none"
          color="grey-900"
          fontSize={compact ? 24 : amount.length > 12 ? 30 : 40}
          lineHeight={compact ? '30px' : amount.length > 12 ? '36px' : '46px'}
        >
          {amount}
        </Heading>
      </YStack>
      <YStack gap="0.5">
        <Paragraph variant="annotation">
          {payment.payee.label ??
            t({
              id: 'paso.payment.payeeLabel',
              message: 'Payee',
              comment: 'Label above the payee of a payment, when the card supplies no label of its own',
            })}
        </Paragraph>
        <Heading heading="h3" textTransform="none" color="grey-900">
          {payment.payee.value}
        </Heading>
      </YStack>
      {payment.payeeLogo && (
        <Circle size={36} borderWidth={1} borderColor="grey-100" bg="white" overflow="hidden">
          <Image
            src={payment.payeeLogo.dataUrl}
            alt={payment.payeeLogo.label}
            width="100%"
            height="100%"
            contentFit="contain"
          />
        </Circle>
      )}
    </YStack>
  )
}

function PasoItem({ item }: { item: PasoDisplayItem }) {
  const { t } = useLingui()

  if (item.kind === 'payment') {
    return (
      <YStack p="3" gap="2" rounded="6" borderWidth={1} borderColor="grey-200" bg="background">
        <Paragraph variant="sub" fontWeight="semiBold" color="grey-600">
          {t({
            id: 'paso.claims.paymentSection',
            message: 'Payment',
            comment: 'Heading of the payment that a mandate or other authorization includes',
          })}
        </Paragraph>
        <PaymentLevels payment={item.payment} compact />
      </YStack>
    )
  }

  return (
    <YStack gap="0.5">
      <PasoLabelText label={item.label} color={item.value ? undefined : 'grey-800'} />
      {item.value?.type === 'image' ? (
        <Circle size={36} borderWidth={1} borderColor="grey-100" bg="white" overflow="hidden" mt="1">
          <Image src={item.value.dataUrl} width="100%" height="100%" contentFit="contain" />
        </Circle>
      ) : (
        item.value && <PasoValueText value={item.value} />
      )}
    </YStack>
  )
}

/** The button that opens the payment card picker, inside the paying account level. */
export function SwitchAccountButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const { t } = useLingui()

  return (
    <Button.Solid
      h="9"
      px="4"
      rounded="12"
      bg="grey-100"
      color="grey-900"
      fontSize="2"
      disabled={disabled}
      onPress={onPress}
    >
      {t({
        id: 'paso.payment.switchCard',
        message: 'Switch',
        comment: 'Button that opens the other cards the user can authorize the payment with',
      })}
    </Button.Solid>
  )
}

/** L8: the quiet row that opens the details sheet. */
export function PasoDetailsRow({ subtitle, onPress }: { subtitle?: string; onPress: () => void }) {
  const { t } = useLingui()

  return (
    <XStack
      items="center"
      justify="space-between"
      gap="3"
      px="4"
      py="3"
      rounded="6"
      borderWidth={1}
      borderColor="grey-200"
      opacity="1 press:0.8"
      onPress={onPress}
      role="button"
    >
      <YStack flex={1} gap="0.5">
        <Paragraph fontWeight="medium" color="grey-600">
          {t({ id: 'paso.details.row', message: 'Details', comment: 'Row that opens the details of a payment' })}
        </Paragraph>
        {subtitle && <Paragraph variant="annotation">{subtitle}</Paragraph>}
      </YStack>
      <HeroIcons.ChevronRight size={18} color="grey-500" />
    </XStack>
  )
}
