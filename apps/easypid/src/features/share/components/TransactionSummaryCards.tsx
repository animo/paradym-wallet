import { formatCurrencyAmount, getSelectedCredentialForEntry } from '@easypid/utils/transactionUtils'
import { Trans, useLingui } from '@lingui/react/macro'
import type { QesTransactionDataEntry, Ts12TransactionDataEntry } from '@package/agent'
import { MiniDocument } from '@package/app'
import { Heading, HeroIcons, Paragraph, XStack, YStack } from '@package/ui'
import { Image } from 'expo-image'

interface QesSummaryCardProps {
  entry: QesTransactionDataEntry
}

export const QesSummaryCard = ({ entry }: QesSummaryCardProps) => {
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          <Trans id="signShare.documentHeading">Documents</Trans>
        </Heading>
        <Paragraph>
          <Trans id="signShare.documentIntro">The following documents will be signed.</Trans>
        </Paragraph>
      </YStack>
      <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
        <YStack f={1} gap="$2">
          <Heading heading="sub2" textTransform="none" color="$grey-800">
            {entry.documentNames.join(', ')}
          </Heading>
          <Paragraph>
            <Trans id="signShare.signingWith">Signing with {entry.qtsp.name}</Trans>
          </Paragraph>
        </YStack>
        <MiniDocument logoUrl={entry.qtsp.logo?.url} />
      </XStack>
    </YStack>
  )
}

interface PaymentSummaryCardProps {
  entry: Ts12TransactionDataEntry
  index: number
  selectedTransactionData?: { credentialId?: string }[]
}

export const PaymentSummaryCard = ({ entry, index, selectedTransactionData }: PaymentSummaryCardProps) => {
  const { i18n } = useLingui()
  // biome-ignore lint/suspicious/noExplicitAny: payload is unknown
  const payload = entry.payload as any
  const formattedAmount = formatCurrencyAmount(Number(payload.amount), payload.currency, i18n.locale)

  const credential = getSelectedCredentialForEntry(entry, index, selectedTransactionData)
  const cardIcon =
    credential?.credential.display.backgroundImage?.url ?? credential?.credential.display.issuer.logo?.url

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          <Trans id="payment.summaryHeading">Payment</Trans>
        </Heading>
        <Paragraph>
          <Trans id="payment.summaryIntro">The following payment will be authorized.</Trans>
        </Paragraph>
      </YStack>
      <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
        <YStack f={1} gap="$1">
          <Heading heading="sub2" textTransform="none" color="$grey-800">
            {payload.payee?.name ?? <Trans id="payment.unknownPayee">Unknown Payee</Trans>}
          </Heading>
          <Paragraph fontWeight="bold">{formattedAmount}</Paragraph>
        </YStack>
        {cardIcon ? (
          <Image source={cardIcon} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="contain" />
        ) : (
          <HeroIcons.CreditCard size={24} color="$grey-600" />
        )}
      </XStack>
    </YStack>
  )
}

interface GenericTransactionSummaryCardProps {
  entry: Ts12TransactionDataEntry
  index: number
  selectedTransactionData?: { credentialId?: string }[]
}

export const GenericTransactionSummaryCard = ({
  entry,
  index,
  selectedTransactionData,
}: GenericTransactionSummaryCardProps) => {
  const { i18n } = useLingui()
  const credential = getSelectedCredentialForEntry(entry, index, selectedTransactionData)
  const selectedCredentialId = credential?.credential.id

  const meta = selectedCredentialId ? entry.metaForIds[selectedCredentialId] : Object.values(entry.metaForIds)[0]

  const title =
    meta?.ui_labels.transaction_title?.find((l) => l.lang === i18n.locale)?.value ??
    meta?.ui_labels.transaction_title?.find((l) => l.lang.startsWith(i18n.locale.split('-')[0]))?.value ??
    meta?.ui_labels.transaction_title?.[0]?.value ??
    entry.type

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          <Trans id="transaction.summaryHeading">Transaction</Trans>
        </Heading>
        <Paragraph>
          <Trans id="transaction.summaryIntro">The following transaction will be authorized.</Trans>
        </Paragraph>
      </YStack>
      <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
        <YStack f={1} gap="$1">
          <Heading heading="sub2" textTransform="none" color="$grey-800">
            {title}
          </Heading>
        </YStack>
        <HeroIcons.QueueList size={24} color="$grey-600" />
      </XStack>
    </YStack>
  )
}
