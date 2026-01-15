import { useLingui } from '@lingui/react/macro'
import type { Ts12TransactionDataEntry } from '@package/agent'
import { Heading, Paragraph, TableContainer, TableRow, XStack, YStack } from '@package/ui'
import { useMemo } from 'react'
import { getValueFromPath, Ts12BaseSlide } from './Ts12BaseSlide'

interface Ts12PaymentSlideProps {
  entry: Ts12TransactionDataEntry
  onCredentialSelect?: (credentialId: string, additionalPayload: object | undefined) => void
  responseMode?: string
  selectedCredentialId?: string
}

export function Ts12PaymentSlide({
  entry,
  onCredentialSelect,
  responseMode,
  selectedCredentialId,
}: Ts12PaymentSlideProps) {
  const { i18n } = useLingui()
  const currentLocale = i18n.locale

  const paymentData = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: payload is unknown
    const payload = entry.payload as any
    return {
      amount: Number(payload.amount),
      currency: payload.currency,
      payeeName: payload.payee?.name,
      payeeId: payload.payee?.id,
    }
  }, [entry])

  const { currencySymbol, formattedAmount } = useMemo(() => {
    try {
      const formatter = new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency: paymentData.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      const parts = formatter.formatToParts(paymentData.amount)
      const symbol = parts.find((part) => part.type === 'currency')?.value ?? paymentData.currency
      const amount = parts
        .filter((part) => part.type !== 'currency')
        .map((part) => part.value)
        .join('')
        .trim()

      return { currencySymbol: symbol, formattedAmount: amount }
    } catch (e) {
      return {
        currencySymbol: paymentData.currency,
        formattedAmount: paymentData.amount.toFixed(2),
      }
    }
  }, [paymentData.amount, paymentData.currency, currentLocale])

  return (
    <Ts12BaseSlide
      entry={entry}
      onCredentialSelect={onCredentialSelect}
      responseMode={responseMode}
      selectedCredentialId={selectedCredentialId}
      renderContent={({ displayMetadata }) => {
        const claimsToDisplay = displayMetadata.claims
          .map((claimDef) => {
            const label =
              claimDef.display.find((d) => d.locale === currentLocale)?.name ??
              claimDef.display.find((d) => d.locale?.startsWith(currentLocale.split('-')[0]))?.name ??
              claimDef.display[0].name

            const value = getValueFromPath(entry, claimDef.path)

            if (value !== undefined) {
              return {
                label,
                value: String(value),
              }
            }
            return null
          })
          .filter((item): item is { label: string; value: string } => item !== null)

        return (
          <YStack gap="$4" f={1}>
            <YStack ai="center" mt="$8">
              <XStack ai="flex-start" gap="$2">
                <Heading fontSize={24} fontWeight="600" lineHeight={70} fontFamily="$heading">
                  {currencySymbol}
                </Heading>
                <Heading fontSize={50} fontWeight="600" lineHeight={75} fontFamily="$heading">
                  {formattedAmount}
                </Heading>
              </XStack>

              <YStack ai="center" gap={0} mt="$1">
                {paymentData.payeeName && (
                  <Heading fontSize={18} fontWeight="600" lineHeight={24} fontFamily="$heading" textAlign="center">
                    {paymentData.payeeName}
                  </Heading>
                )}
                {paymentData.payeeId && (
                  <Paragraph
                    fontSize={14}
                    fontWeight="400"
                    lineHeight={20}
                    color="#656974"
                    fontFamily="$body"
                    textAlign="center"
                    letterSpacing={0.15}
                  >
                    {paymentData.payeeId}
                  </Paragraph>
                )}
              </YStack>
            </YStack>

            <YStack mt="$4" px="$4">
              <TableContainer>
                {claimsToDisplay.map((claim, idx) => (
                  <TableRow
                    key={idx}
                    variant="horizontal"
                    attributes={claim.label}
                    values={claim.value}
                    isLastRow={idx === claimsToDisplay.length - 1}
                  />
                ))}
              </TableContainer>
            </YStack>
          </YStack>
        )
      }}
    />
  )
}
