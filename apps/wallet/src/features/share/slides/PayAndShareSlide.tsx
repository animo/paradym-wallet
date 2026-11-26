import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { commonMessages } from '@package/translations'
import { Button, Heading, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import {
  type FormattedSubmission,
  type FormattedTransactionDataPaymentSingle,
  hasMissingCards,
} from '@paradym/wallet-sdk'
import { useState } from 'react'
import { CardRow } from '../components/CardRow'
import { CardSelectionSheet } from '../components/CardSelectionSheet'
import { SwitchAccountButton } from '../components/PasoTransactionFrame'
import { PayingAccount } from '../components/PayingAccount'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface PayAndShareSlideProps {
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  transaction: FormattedTransactionDataPaymentSingle
  submission?: FormattedSubmission
  onSelectCredential?: (inputDescriptorId: string, credentialRecordId: string) => void
}

export const PayAndShareSlide = ({
  onAccept,
  onDecline,
  isAccepting,
  transaction,
  submission,
  onSelectCredential,
}: PayAndShareSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const [isCardSheetOpen, setIsCardSheetOpen] = useState(false)
  const { t } = useLingui()

  // The card that pays is shown with the payment, the other requested cards with their attributes
  const paymentEntry = submission?.entries.find(
    (entry) => entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
  )
  const paymentCard = paymentEntry?.isSatisfied ? paymentEntry.credentials[0] : undefined
  const otherEntries = submission?.entries.filter((entry) => entry !== paymentEntry) ?? []

  const handleAccept = async () => {
    // Manually set to instantly show the loading state
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const acceptLabel = t({
    id: 'payShare.accept',
    message: 'Pay & share',
    comment: 'Button label for accepting a pay-and-share request',
  })

  return (
    <YStack grow={1} justify="space-between">
      <YStack gap="5" grow={1}>
        <Heading>{t(commonMessages.reviewRequestTitle)}</Heading>

        <YStack
          grow={1}
          px="5"
          mx="-5"
          borderColor={isScrolledByOffset ? 'grey-200' : 'background'}
          onLayout={(event) => {
            if (!scrollViewHeight) setScrollViewHeight(event.nativeEvent.layout.height)
          }}
          borderTopWidth="1"
        >
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={{ gap: '8' }}
            px="5"
            mx="-5"
            pt="5"
            maxHeight={scrollViewHeight}
            bg="white"
          >
            <YStack gap="5">
              <YStack gap="2">
                <Heading heading="sub2">{t(commonMessages.paymentHeading)}</Heading>
                <Paragraph>
                  <Trans id="payShare.documentIntro" comment="Text above the payment to be paid">
                    The following payment will be authorized
                  </Trans>
                </Paragraph>
              </YStack>
              <XStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="5" p="5">
                <YStack flex={1} gap="2" items="center">
                  <Heading textTransform="none" color="grey-800">
                    {transaction.amount}
                  </Heading>
                  <Paragraph variant="sub" size="2">
                    {/* TODO: derive payment network from SCA */}
                    <Trans>Paying with iDeal | Wero</Trans>
                  </Paragraph>
                </YStack>
              </XStack>
              {paymentCard && (
                <PayingAccount
                  action={
                    paymentEntry?.isSatisfied &&
                    paymentEntry.credentials.length > 1 && (
                      <SwitchAccountButton disabled={isProcessing} onPress={() => setIsCardSheetOpen(true)} />
                    )
                  }
                >
                  <CardRow card={paymentCard} artwork={credentialSvgArtwork(paymentCard.credential.display.svg)} wrap />
                </PayingAccount>
              )}
            </YStack>
            {submission && otherEntries.length > 0 && (
              <RequestedAttributesSection
                submission={{ ...submission, entries: otherEntries }}
                onSelectCredential={onSelectCredential}
              />
            )}
            <Spacer size="5" />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5" bg="background">
        {submission?.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText={acceptLabel}
            onAccept={handleAccept}
            onDecline={onCancel}
            isLoading={isProcessing}
          />
        ) : (
          <YStack gap="3">
            <Paragraph variant="sub" fontWeight="medium" text="center" color="danger-500">
              {t(
                !submission || hasMissingCards(submission)
                  ? commonMessages.missingCardsWarning
                  : getUnmetAttributeMessages(submission).warning
              )}
            </Paragraph>
            <Button.Solid onPress={onDecline}>{t(commonMessages.close)}</Button.Solid>
          </YStack>
        )}
      </YStack>

      {paymentEntry?.isSatisfied && paymentCard && (
        <CardSelectionSheet
          isOpen={isCardSheetOpen}
          setIsOpen={setIsCardSheetOpen}
          title={t({
            id: 'paso.consent.chooseAccountTitle',
            message: 'Choose a paying account',
            comment: 'Title of the sheet where the user picks the account to authorize a payment with',
          })}
          cards={paymentEntry.credentials}
          selectedCardId={paymentCard.credential.record.id}
          onSelect={(credentialRecordId) => onSelectCredential?.(paymentEntry.inputDescriptorId, credentialRecordId)}
        />
      )}
    </YStack>
  )
}
