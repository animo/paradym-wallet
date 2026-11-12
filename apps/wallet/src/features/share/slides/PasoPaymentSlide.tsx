import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { commonMessages } from '@package/translations'
import { Button, Circle, Heading, HeroIcons, Image, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import {
  type DisplayImage,
  type FormattedSubmission,
  type FormattedTransactionDataPasoPayment,
  hasMissingCards,
} from '@paradym/wallet-sdk'
import { useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { CardRow } from '../components/CardRow'
import { CardSelectionSheet } from '../components/CardSelectionSheet'
import { PaymentTransactionDetails } from '../components/PaymentTransactionDetails'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'
import { useTransactionDataSeen } from '../useTransactionDataSeen'

interface PasoPaymentSlideProps {
  transaction: FormattedTransactionDataPasoPayment
  verifier: { name: string; logo?: DisplayImage }
  submission?: FormattedSubmission
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  /** Whether `transaction` is being resolved again for a newly picked card. */
  isResolvingTransaction?: boolean
  onSelectCredential?: (inputDescriptorId: string, credentialRecordId: string) => void
}

/**
 * The PaSO consent screen for `urn:paso:sca:global:payment:1`.
 *
 * A *dedicated* UI in the sense of [PaSO View] Section 1.1: it renders the Basic Payments rulebook
 * rather than driving a generic renderer off the metadata. Two rules from the spec are load-bearing
 * and not obvious from the layout:
 *
 * - [PaSO Core] Section 5.3 / [PaSO View] Section 2: the confirmation action stays disabled until
 *   every claim designated for display has actually been shown — see `transactionDataEnd` below for
 *   what "shown" is measured against.
 * - [PaSO Proof Metadata] Section 3.2: a dedicated UI may substitute its own labels for anything in
 *   `ui_labels` — except `security_hint`, which is shown exactly as provided and never replaced.
 *
 * Labels come from the credential metadata where the issuer supplied them, which is also what makes
 * `display_locale` in the proof mean something: it names the entries the user actually read.
 */
export const PasoPaymentSlide = ({
  transaction,
  verifier,
  submission,
  onAccept,
  onDecline,
  isAccepting,
  isResolvingTransaction = false,
  onSelectCredential,
}: PasoPaymentSlideProps) => {
  const { onNext, onCancel, confirmCombined } = useWizard()
  const { t } = useLingui()
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const [isCardSheetOpen, setIsCardSheetOpen] = useState(false)

  // Every card that can authorize the payment. The first is the one the transaction was resolved
  // against and will be presented; picking another moves it to the front (`selectSubmissionCredentials`).
  const paymentCards =
    submission?.entries.find(
      (entry): entry is typeof entry & { isSatisfied: true } =>
        entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
    )?.credentials ?? []
  const cardForPayment = paymentCards[0]

  // The payment card has its own section above, so it is left out of the requested cards. When there
  // is no card for the payment, its entry stays there to say which card is missing.
  const otherEntries =
    submission?.entries.filter(
      (entry) => !cardForPayment || entry.inputDescriptorId !== transaction.cardForTransactionId
    ) ?? []

  // The header names who asks for the payment. For a merchant asking to be paid itself that is the
  // payee shown right below it, so the header is left out rather than naming them twice.
  const showVerifierHeader = verifier.name.trim().toLowerCase() !== transaction.payee.value.trim().toLowerCase()

  const { hasSeenTransactionData, onTransactionDataLayout, onViewportLayout, onScroll } = useTransactionDataSeen()

  const handleScrollEvent = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event)
    onScroll(event)
  }

  const handleAccept = async () => {
    // Next to a step that asks for a confirmation first, paying waits for it
    if (confirmCombined && !(await confirmCombined())) return
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  return (
    <YStack grow={1} justify="space-between">
      <YStack gap="5" grow={1}>
        <Heading>{transaction.transactionTitle ?? t(commonMessages.paymentHeading)}</Heading>

        {/* The slide sits in the wizard's own scroll view, where a flex child grows with its content
            instead of being capped. The scroll view is laid over the space the flex area is given
            rather than inside it, so its content can't push the buttons off the screen. */}
        <YStack
          grow={1}
          mx="-5"
          borderColor={isScrolledByOffset ? 'grey-200' : 'background'}
          position="relative"
          onLayout={onViewportLayout}
          borderTopWidth="1"
        >
          <ScrollView
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            onScroll={handleScrollEvent}
            onLayout={onViewportLayout}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={{ gap: '8' }}
            px="5"
            py="5"
          >
            {/* Everything PaSO requires to have been displayed, measured as one block. */}
            <YStack gap="5" onLayout={onTransactionDataLayout}>
              {showVerifierHeader && (
                <XStack items="center" px="8" justify="center" flexDirection="column">
                  <Circle size={88} borderWidth="1" borderColor="grey-100" bg="white">
                    {verifier.logo?.url ? (
                      <Image
                        circle
                        src={verifier.logo.url}
                        alt={verifier.logo.altText}
                        width="100%"
                        height="100%"
                        contentFit="contain"
                      />
                    ) : (
                      <HeroIcons.BuildingOffice color="grey-800" size={36} />
                    )}
                  </Circle>
                  <Paragraph variant="sub" text="center">
                    <Trans
                      id="paso.payment.description"
                      comment="Explanation that the user is about to authorize a payment"
                    >
                      {verifier.name} wants you to authorize a payment.
                    </Trans>
                  </Paragraph>
                </XStack>
              )}

              <PaymentTransactionDetails transaction={transaction} />
            </YStack>

            {/* Below here is context, not transaction data: which card pays, and what else is asked. */}
            {cardForPayment && (
              <YStack gap="2">
                <XStack items="center" justify="space-between" gap="2">
                  <Heading heading="sub2">
                    <Trans id="paso.payment.cardHeading" comment="Heading above the card used to authorize a payment">
                      Payment card
                    </Trans>
                  </Heading>
                  {paymentCards.length > 1 && (
                    <Button.Solid
                      h="9"
                      px="4"
                      rounded="12"
                      bg="grey-100"
                      color="grey-900"
                      fontSize="2"
                      disabled={isProcessing || isResolvingTransaction}
                      onPress={() => setIsCardSheetOpen(true)}
                    >
                      {t({
                        id: 'paso.payment.switchCard',
                        message: 'Switch',
                        comment: 'Button that opens the other cards the user can authorize the payment with',
                      })}
                    </Button.Solid>
                  )}
                </XStack>
                <XStack p="3" rounded="6" borderWidth={1} borderColor="grey-200">
                  <CardRow
                    card={cardForPayment}
                    artwork={credentialSvgArtwork(cardForPayment.credential.display.svg)}
                  />
                </XStack>
              </YStack>
            )}

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
          <YStack gap="2">
            <DualResponseButtons
              align="horizontal"
              // [PaSO View] Section 2: the issuer's labels may not be truncated, so they wrap, and the
              // buttons stack at full width when they do not fit side by side.
              wrapLabels
              acceptText={
                transaction.affirmativeActionLabel ??
                t({
                  id: 'paso.payment.accept',
                  message: 'Pay',
                  comment: 'Fallback label for the button that authorizes a PaSO payment',
                })
              }
              declineText={transaction.denialActionLabel}
              onAccept={handleAccept}
              onDecline={onCancel}
              isLoading={isProcessing}
              isAcceptDisabled={!hasSeenTransactionData || isResolvingTransaction}
              variant={confirmCombined ? 'confirmation' : 'regular'}
            />
            {!hasSeenTransactionData && (
              <Paragraph variant="annotation" text="center">
                <Trans
                  id="paso.payment.scrollToConfirm"
                  comment="Shown while the user has not yet scrolled through all payment details"
                >
                  Scroll down to review all payment details.
                </Trans>
              </Paragraph>
            )}
          </YStack>
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

      {cardForPayment && (
        <CardSelectionSheet
          isOpen={isCardSheetOpen}
          setIsOpen={setIsCardSheetOpen}
          title={t({
            id: 'paso.payment.chooseCardTitle',
            message: 'Choose a payment card',
            comment: 'Title of the sheet where the user picks the card to authorize a payment with',
          })}
          cards={paymentCards}
          selectedCardId={cardForPayment.credential.record.id}
          onSelect={(credentialRecordId) => onSelectCredential?.(transaction.cardForTransactionId, credentialRecordId)}
        />
      )}
    </YStack>
  )
}
