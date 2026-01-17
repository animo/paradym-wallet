import { formatCurrencyAmount, getSelectedCredentialForEntry } from '@easypid/utils/transactionUtils'
import { Trans, useLingui } from '@lingui/react/macro'
import type { FormattedTransactionData, QesTransactionDataEntry, Ts12TransactionDataEntry } from '@package/agent'
import { MiniDocument } from '@package/app'
import { Heading, HeroIcons, Paragraph, XStack, YStack } from '@package/ui'
import { Image } from 'expo-image'

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'stopped'

const QesTransactionRow = ({ entry, status }: { entry: QesTransactionDataEntry; status: TransactionStatus }) => {
  return (
    <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
      <YStack f={1} gap="$2">
        <Heading heading="sub2" textTransform="none" color="$grey-800">
          {entry.documentNames.join(', ')}
        </Heading>
        <Paragraph>
          {status === 'pending' ? (
            <Trans id="signShare.signingWith">Signing with {entry.qtsp.name}</Trans>
          ) : (
            <Trans id="activity.signedWithQTSP">Signing with {entry.qtsp.name}</Trans>
          )}
        </Paragraph>
      </YStack>
      <MiniDocument logoUrl={entry.qtsp.logo?.url} />
    </XStack>
  )
}

const PaymentTransactionRow = ({
  entry,
  index,
  selectedTransactionData,
}: {
  entry: Ts12TransactionDataEntry
  index: number
  selectedTransactionData?: { credentialId?: string }[]
}) => {
  const { i18n } = useLingui()
  // biome-ignore lint/suspicious/noExplicitAny: payload is unknown
  const payload = entry.payload as any
  const formattedAmount = formatCurrencyAmount(Number(payload.amount), payload.currency, i18n.locale)

  const credential = getSelectedCredentialForEntry(entry, index, selectedTransactionData)
  const cardIcon =
    credential?.credential.display.backgroundImage?.url ?? credential?.credential.display.issuer.logo?.url

  return (
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
  )
}

const GenericTransactionRow = ({
  entry,
  index,
  selectedTransactionData,
}: {
  entry: Ts12TransactionDataEntry
  index: number
  selectedTransactionData?: { credentialId?: string }[]
}) => {
  const { i18n } = useLingui()
  const credential = getSelectedCredentialForEntry(entry, index, selectedTransactionData)
  const selectedCredentialId = credential?.credential.id

  const meta = selectedCredentialId ? entry.metaForIds[selectedCredentialId] : Object.values(entry.metaForIds)[0]

  const title =
    meta?.ui_labels.transaction_title?.find((l) => l.locale === i18n.locale)?.value ??
    meta?.ui_labels.transaction_title?.find((l) => l.locale.startsWith(i18n.locale.split('-')[0]))?.value ??
    meta?.ui_labels.transaction_title?.[0]?.value ??
    entry.type

  return (
    <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
      <YStack f={1} gap="$1">
        <Heading heading="sub2" textTransform="none" color="$grey-800">
          {title}
        </Heading>
      </YStack>
      <HeroIcons.QueueList size={24} color="$grey-600" />
    </XStack>
  )
}

const QesSection = ({
  items,
  status,
}: {
  items: { entry: QesTransactionDataEntry; index: number }[]
  status: TransactionStatus
}) => {
  const count = items.length
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          {count > 1 ? (
            <Trans id="signShare.documentsHeading">Documents</Trans>
          ) : status === 'pending' ? (
            <Trans id="signShare.documentHeading">Document</Trans>
          ) : (
            <Trans id="activity.documentHeading">Document</Trans>
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' &&
            (count > 1 ? (
              <Trans id="signShare.documentsIntro">The following documents will be signed.</Trans>
            ) : (
              <Trans id="signShare.documentIntro">The following document will be signed.</Trans>
            ))}
          {status === 'success' &&
            (count > 1 ? (
              <Trans id="activity.documentsSigned">The documents were signed.</Trans>
            ) : (
              <Trans id="activity.documentSigned">The document was signed.</Trans>
            ))}
          {(status === 'failed' || status === 'stopped') &&
            (count > 1 ? (
              <Trans id="activity.documentsNotSigned">The documents were not signed.</Trans>
            ) : (
              <Trans id="activity.documentNotSigned">The document was not signed.</Trans>
            ))}
        </Paragraph>
      </YStack>
      {items.map(({ entry, index }) => (
        <QesTransactionRow key={index} entry={entry} status={status} />
      ))}
    </YStack>
  )
}

const PaymentSection = ({
  items,
  selectedTransactionData,
  status,
}: {
  items: { entry: Ts12TransactionDataEntry; index: number }[]
  selectedTransactionData?: { credentialId?: string }[]
  status: TransactionStatus
}) => {
  const count = items.length
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          {count > 1 ? (
            <Trans id="payment.paymentsHeading">Payments</Trans>
          ) : status === 'pending' ? (
            <Trans id="payment.summaryHeading">Payment</Trans>
          ) : (
            <Trans id="activity.paymentHeading">Payment</Trans>
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' &&
            (count > 1 ? (
              <Trans id="payment.paymentsIntro">The following payments will be authorized.</Trans>
            ) : (
              <Trans id="payment.summaryIntro">The following payment will be authorized.</Trans>
            ))}
          {status === 'success' &&
            (count > 1 ? (
              <Trans id="activity.paymentsApproved">The payments were approved.</Trans>
            ) : (
              <Trans id="activity.paymentApproved">The payment was approved.</Trans>
            ))}
          {(status === 'failed' || status === 'stopped') &&
            (count > 1 ? (
              <Trans id="activity.paymentsNotApproved">The payments were not approved.</Trans>
            ) : (
              <Trans id="activity.paymentNotApproved">The payment was not approved.</Trans>
            ))}
        </Paragraph>
      </YStack>
      {items.map(({ entry, index }) => (
        <PaymentTransactionRow
          key={index}
          entry={entry}
          index={index}
          selectedTransactionData={selectedTransactionData}
        />
      ))}
    </YStack>
  )
}

const GenericSection = ({
  items,
  selectedTransactionData,
  status,
}: {
  items: { entry: Ts12TransactionDataEntry; index: number }[]
  selectedTransactionData?: { credentialId?: string }[]
  status: TransactionStatus
}) => {
  const count = items.length
  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Heading heading="sub2">
          {count > 1 ? (
            <Trans id="transaction.transactionsHeading">Transactions</Trans>
          ) : status === 'pending' ? (
            <Trans id="transaction.summaryHeading">Transaction</Trans>
          ) : (
            <Trans id="activity.transactionHeading">Transaction</Trans>
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' &&
            (count > 1 ? (
              <Trans id="transaction.transactionsIntro">The following transactions will be authorized.</Trans>
            ) : (
              <Trans id="transaction.summaryIntro">The following transaction will be authorized.</Trans>
            ))}
          {status === 'success' &&
            (count > 1 ? (
              <Trans id="activity.transactionsApproved">The transactions were approved.</Trans>
            ) : (
              <Trans id="activity.transactionApproved">The transaction was approved.</Trans>
            ))}
          {(status === 'failed' || status === 'stopped') &&
            (count > 1 ? (
              <Trans id="activity.transactionsNotApproved">The transactions were not approved.</Trans>
            ) : (
              <Trans id="activity.transactionNotApproved">The transaction was not approved.</Trans>
            ))}
        </Paragraph>
      </YStack>
      {items.map(({ entry, index }) => (
        <GenericTransactionRow
          key={index}
          entry={entry}
          index={index}
          selectedTransactionData={selectedTransactionData}
        />
      ))}
    </YStack>
  )
}

interface TransactionListProps {
  formattedTransactionData?: FormattedTransactionData
  selectedTransactionData?: { credentialId?: string }[]
  status?: TransactionStatus
}

export const TransactionList = ({
  formattedTransactionData,
  selectedTransactionData,
  status = 'pending',
}: TransactionListProps) => {
  const indexedData = formattedTransactionData?.map((entry, index) => ({ entry, index })) ?? []

  const qesEntries = indexedData.filter((x) => x.entry.type === 'qes_authorization') as {
    entry: QesTransactionDataEntry
    index: number
  }[]

  const paymentEntries = indexedData.filter((x) => x.entry.type === 'urn:eudi:sca:payment:1') as {
    entry: Ts12TransactionDataEntry
    index: number
  }[]

  const genericEntries = indexedData.filter(
    (x) => x.entry.type !== 'qes_authorization' && x.entry.type !== 'urn:eudi:sca:payment:1'
  ) as { entry: Ts12TransactionDataEntry; index: number }[]

  return (
    <>
      {qesEntries.length > 0 && <QesSection items={qesEntries} status={status} />}
      {paymentEntries.length > 0 && (
        <PaymentSection items={paymentEntries} selectedTransactionData={selectedTransactionData} status={status} />
      )}
      {genericEntries.length > 0 && (
        <GenericSection items={genericEntries} selectedTransactionData={selectedTransactionData} status={status} />
      )}
    </>
  )
}
