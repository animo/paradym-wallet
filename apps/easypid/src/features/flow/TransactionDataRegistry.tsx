import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Heading, HeroIcons, Paragraph, XStack, YStack } from '@package/ui'
import {
  EUDI_PAYMENT_TRANSACTION_DATA_TYPES,
  type FormattedSubmissionTransactionData,
  type FormattedSubmissionTransactionDataError,
  type FormattedTransactionData,
  FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE,
} from '@paradym/wallet-sdk'
import type { ComponentType } from 'react'

export type TransactionData = FormattedSubmissionTransactionData | NonNullable<FormattedTransactionData>
type TranslationFunction = ReturnType<typeof useLingui>['t']

export type TransactionDataWidgetProps = {
  transactionData: TransactionData
}

function TransactionDataErrorRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null

  return (
    <YStack gap="$1">
      <Paragraph variant="caption" color="$danger-700">
        {label}
      </Paragraph>
      <Paragraph color="$danger-700" fontWeight="$semiBold">
        {value}
      </Paragraph>
    </YStack>
  )
}

export function TransactionDataErrorWidget({
  error,
  isDevelopmentModeEnabled,
}: {
  error: FormattedSubmissionTransactionDataError
  isDevelopmentModeEnabled: boolean | undefined
}) {
  const { t } = useLingui()

  return (
    <YStack gap="$3">
      <YStack p="$3.5" br="$6" bg="$danger-300" borderWidth={1} borderColor="$danger-500" gap="$3">
        <XStack gap="$3" ai="flex-start">
          <HeroIcons.ExclamationTriangleFilled size={24} color="$danger-500" />
          <YStack f={1} gap="$1">
            <Heading heading="h4" color="$danger-700" textTransform="none">
              {t({
                id: 'flow.transaction.unsupportedTitle',
                message: 'Unsupported transaction data',
                comment: 'Title for transaction-data requests the wallet cannot process',
              })}
            </Heading>
            <Paragraph color="$danger-700">
              {t({
                id: 'flow.transaction.unsupportedDescription',
                message: 'This request needs a credential to sign transaction data this wallet cannot display.',
                comment: 'Description for unsupported transaction-data requests',
              })}
            </Paragraph>
          </YStack>
        </XStack>

        <YStack gap="$2.5">
          <TransactionDataErrorRow
            label={t({
              id: 'flow.transaction.unsupportedType',
              message: 'Transaction type',
              comment: 'Label for unsupported transaction-data type',
            })}
            value={error.transactionDataType}
          />
          <TransactionDataErrorRow
            label={t({
              id: 'flow.transaction.requiredCredential',
              message: 'Required credential',
              comment: 'Label for the credential required by transaction data',
            })}
            value={error.requiredCredential}
          />
          <TransactionDataErrorRow
            label={t({
              id: 'flow.transaction.credentialQueryId',
              message: 'Credential query',
              comment: 'Label for credential query id targeted by transaction data',
            })}
            value={error.credentialQueryId}
          />
        </YStack>
      </YStack>

      {isDevelopmentModeEnabled && error.debugMessage ? (
        <YStack p="$3" br="$5" bg="$grey-100" borderWidth={1} borderColor="$grey-300" gap="$2">
          <Paragraph variant="caption" color="$grey-700">
            {t({
              id: 'flow.transaction.debugDetails',
              message: 'Debug details',
              comment: 'Heading for debug-only transaction-data error details',
            })}
          </Paragraph>
          <Paragraph variant="annotation" color="$grey-700">
            {error.debugMessage}
          </Paragraph>
        </YStack>
      ) : null}
    </YStack>
  )
}

type TransactionDataUiDefinition = {
  Widget: ComponentType<TransactionDataWidgetProps>
  getPresentationTitle?: (transactionData: TransactionData, t: TranslationFunction) => string
  getPresentationAcceptLabel?: (transactionData: TransactionData, t: TranslationFunction) => string
  getPresentationDeclineLabel?: (transactionData: TransactionData, t: TranslationFunction) => string
  getConsentTitle?: (transactionData: TransactionData, t: TranslationFunction) => string
  getConsentAcceptLabel?: (transactionData: TransactionData, t: TranslationFunction) => string
  getConsentDeclineLabel?: (transactionData: TransactionData, t: TranslationFunction) => string
}

function FunkeQesTransactionDataWidget({ transactionData }: TransactionDataWidgetProps) {
  const { t } = useLingui()
  const title =
    'documentName' in transactionData
      ? transactionData.documentName
      : (transactionData.title ??
        t({
          id: 'flow.transaction.titleFallback',
          message: 'Transaction',
          comment: 'Fallback title for transaction details',
        }))
  const subtitle = 'qtsp' in transactionData ? (transactionData.qtsp.name ?? transactionData.qtsp.hostName) : undefined

  return (
    <YStack p="$3" br="$5" bg="$grey-100" gap="$1">
      <Heading heading="h4">{title}</Heading>
      {subtitle ? <Paragraph variant="annotation">{subtitle}</Paragraph> : null}
      {'claims' in transactionData
        ? transactionData.claims.map((claim, index) => (
            <XStack key={`${claim.label}-${index}`} jc="space-between" gap="$4">
              <Paragraph variant="caption">{claim.label}</Paragraph>
              <Paragraph flexShrink={1} textAlign="right" emphasis>
                {claim.value}
              </Paragraph>
            </XStack>
          ))
        : null}
      {'securityHint' in transactionData && transactionData.securityHint ? (
        <Paragraph variant="annotation">{transactionData.securityHint}</Paragraph>
      ) : null}
    </YStack>
  )
}

function EudiPaymentTransactionDataWidget({ transactionData }: TransactionDataWidgetProps) {
  const { t } = useLingui()
  const payment = 'payment' in transactionData ? transactionData.payment : undefined
  const amountParts = payment?.amount?.split(/\s+/) ?? []
  const currencySymbol = amountParts.length > 1 ? amountParts[0] : undefined
  const formattedAmount = amountParts.length > 1 ? amountParts.slice(1).join(' ') : payment?.amount

  return (
    <YStack>
      <YStack ai="center" gap="$1">
        <XStack ai="flex-start" jc="center" gap="$2" flexWrap="wrap">
          {currencySymbol ? (
            <Heading fontSize={24} fontWeight="600" lineHeight={72} fontFamily="$heading">
              {currencySymbol}
            </Heading>
          ) : null}
          <Heading fontSize={100} fontWeight="600" lineHeight={104} fontFamily="$heading">
            {formattedAmount ??
              t({
                id: 'flow.transaction.payment.amountFallback',
                message: 'Payment amount',
                comment: 'Fallback when payment amount could not be displayed',
              })}
          </Heading>
        </XStack>

        <YStack ai="center" gap={0} w="100%" px="$4">
          {payment?.payeeName ? (
            <Heading fontSize={18} fontWeight="600" lineHeight={24} fontFamily="$heading" textAlign="center">
              {payment.payeeName}
            </Heading>
          ) : null}
          {payment?.payeeId ? (
            <Paragraph
              fontSize={14}
              fontWeight="400"
              lineHeight={20}
              color="#656974"
              fontFamily="$body"
              textAlign="center"
              letterSpacing={0.15}
            >
              {payment.payeeId}
            </Paragraph>
          ) : null}
        </YStack>
      </YStack>
    </YStack>
  )
}

export const transactionDataUiDefinitions: Record<string, TransactionDataUiDefinition> = {
  [FUNKE_QES_AUTHORIZATION_TRANSACTION_DATA_TYPE]: {
    Widget: FunkeQesTransactionDataWidget,
    getPresentationTitle: (_transactionData, t) =>
      t({
        id: 'presentation.onePage.signTitle',
        message: 'Review signature request',
        comment: 'Title for one page signature review',
      }),
    getPresentationAcceptLabel: (_transactionData, t) =>
      t({
        id: 'presentation.onePage.sign',
        message: 'Sign and share',
        comment: 'Button label to accept a signing request',
      }),
    getConsentAcceptLabel: (transactionData, t) =>
      'affirmativeActionLabel' in transactionData && transactionData.affirmativeActionLabel
        ? transactionData.affirmativeActionLabel
        : t({
            id: 'dcApi.transactionDataConsent.share',
            message: 'Share data',
            comment: 'Button label to confirm undisplayed DC API transaction data and share',
          }),
    getConsentDeclineLabel: (transactionData, t) =>
      'denialActionLabel' in transactionData && transactionData.denialActionLabel
        ? transactionData.denialActionLabel
        : t(commonMessages.declineButton),
  },
  ...Object.fromEntries(
    EUDI_PAYMENT_TRANSACTION_DATA_TYPES.map((type) => [
      type,
      {
        Widget: EudiPaymentTransactionDataWidget,
        getPresentationTitle: (transactionData: TransactionData, t: TranslationFunction) =>
          ('title' in transactionData ? transactionData.title : undefined) ??
          t({
            id: 'presentation.onePage.paymentTitle',
            message: 'Review payment',
            comment: 'Title for one page payment review',
          }),
        getPresentationAcceptLabel: (transactionData: TransactionData, t: TranslationFunction) =>
          ('affirmativeActionLabel' in transactionData ? transactionData.affirmativeActionLabel : undefined) ??
          t({
            id: 'presentation.onePage.payment',
            message: 'Authorize payment',
            comment: 'Button label to accept a payment request',
          }),
        getPresentationDeclineLabel: (transactionData: TransactionData, t: TranslationFunction) =>
          ('denialActionLabel' in transactionData ? transactionData.denialActionLabel : undefined) ??
          t(commonMessages.cancel),
        getConsentTitle: (transactionData: TransactionData, t: TranslationFunction) =>
          ('title' in transactionData ? transactionData.title : undefined) ??
          t({
            id: 'dcApi.transactionDataConsent.paymentTitle',
            message: 'Review payment',
            comment: 'Title shown when DC API did not display payment transaction data in the system selector',
          }),
        getConsentAcceptLabel: (transactionData: TransactionData, t: TranslationFunction) =>
          'affirmativeActionLabel' in transactionData && transactionData.affirmativeActionLabel
            ? transactionData.affirmativeActionLabel
            : t({
                id: 'dcApi.transactionDataConsent.authorizePayment',
                message: 'Authorize payment',
                comment: 'Button label to confirm undisplayed DC API payment transaction data',
              }),
        getConsentDeclineLabel: (transactionData: TransactionData, t: TranslationFunction) =>
          'denialActionLabel' in transactionData && transactionData.denialActionLabel
            ? transactionData.denialActionLabel
            : t(commonMessages.declineButton),
      },
    ])
  ),
}

function getTransactionDataUiDefinition(transactionData: TransactionData) {
  const definition = transactionDataUiDefinitions[transactionData.type]
  if (!definition) throw new Error(`Unsupported transaction data type '${transactionData.type}'`)

  return definition
}

export function useTransactionDataPresentationLabels(transactionData?: TransactionData) {
  const { t } = useLingui()
  const definition = transactionData ? getTransactionDataUiDefinition(transactionData) : undefined

  return {
    title:
      (transactionData && definition?.getPresentationTitle?.(transactionData, t)) ??
      t({
        id: 'presentation.onePage.title',
        message: 'Review data request',
        comment: 'Title for one page presentation review',
      }),
    acceptLabel:
      (transactionData && definition?.getPresentationAcceptLabel?.(transactionData, t)) ??
      t({
        id: 'presentation.onePage.share',
        message: 'Share data',
        comment: 'Button label to accept a presentation request',
      }),
    declineLabel:
      (transactionData && definition?.getPresentationDeclineLabel?.(transactionData, t)) ??
      t(commonMessages.declineButton),
  }
}

export function useTransactionDataConsentLabels(transactionData?: TransactionData) {
  const { t } = useLingui()
  const definition = transactionData ? getTransactionDataUiDefinition(transactionData) : undefined

  return {
    title:
      (transactionData && definition?.getConsentTitle?.(transactionData, t)) ??
      t({
        id: 'dcApi.transactionDataConsent.title',
        message: 'Review transaction',
        comment: 'Title shown when DC API did not display transaction data in the system selector',
      }),
    acceptLabel:
      (transactionData && definition?.getConsentAcceptLabel?.(transactionData, t)) ??
      t({
        id: 'dcApi.transactionDataConsent.share',
        message: 'Share data',
        comment: 'Button label to confirm undisplayed DC API transaction data and share',
      }),
    declineLabel:
      (transactionData && definition?.getConsentDeclineLabel?.(transactionData, t)) ?? t(commonMessages.declineButton),
  }
}

export function getTransactionDataWidget(transactionData: TransactionData) {
  return getTransactionDataUiDefinition(transactionData).Widget
}

export function TransactionDataWidget({ transactionData }: TransactionDataWidgetProps) {
  const Widget = getTransactionDataWidget(transactionData)

  return <Widget transactionData={transactionData} />
}
