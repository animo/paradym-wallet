import { formatCurrencyAmount, getSelectedCredentialForEntry } from '@easypid/utils/transactionUtils'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
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
          {status === 'pending' ? (
            <Plural id="signShare.documentHeading" value={count} one="Document" other="Documents" />
          ) : (
            <Plural id="activity.documentHeading" value={count} one="Document" other="Documents" />
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' && (
            <Plural
              id="signShare.documentIntro"
              value={count}
              one="The following document will be signed."
              other="The following documents will be signed."
            />
          )}
          {status === 'success' && (
            <Plural
              id="activity.documentSigned"
              value={count}
              one="The document was signed."
              other="The documents were signed."
            />
          )}
          {(status === 'failed' || status === 'stopped') && (
            <Plural
              id="activity.documentNotSigned"
              value={count}
              one="The document was not signed."
              other="The documents were not signed."
            />
          )}
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
          {status === 'pending' ? (
            <Plural id="payment.summaryHeading" value={count} one="Payment" other="Payments" />
          ) : (
            <Plural id="activity.paymentHeading" value={count} one="Payment" other="Payments" />
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' && (
            <Plural
              id="payment.summaryIntro"
              value={count}
              one="The following payment will be authorized."
              other="The following payments will be authorized."
            />
          )}
          {status === 'success' && (
            <Plural
              id="activity.paymentApproved"
              value={count}
              one="The payment was approved."
              other="The payments were approved."
            />
          )}
          {(status === 'failed' || status === 'stopped') && (
            <Plural
              id="activity.paymentNotApproved"
              value={count}
              one="The payment was not approved."
              other="The payments were not approved."
            />
          )}
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
          {status === 'pending' ? (
            <Plural id="transaction.summaryHeading" value={count} one="Transaction" other="Transactions" />
          ) : (
            <Plural id="activity.transactionHeading" value={count} one="Transaction" other="Transactions" />
          )}
        </Heading>
        <Paragraph>
          {status === 'pending' && (
            <Plural
              id="transaction.summaryIntro"
              value={count}
              one="The following transaction will be authorized."
              other="The following transactions will be authorized."
            />
          )}
          {status === 'success' && (
            <Plural
              id="activity.transactionApproved"
              value={count}
              one="The transaction was approved."
              other="The transactions were approved."
            />
          )}
          {(status === 'failed' || status === 'stopped') && (
            <Plural
              id="activity.transactionNotApproved"
              value={count}
              one="The transaction was not approved."
              other="The transactions were not approved."
            />
          )}
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
