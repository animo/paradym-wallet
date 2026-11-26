import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { plural } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { commonMessages } from '@package/translations'
import {
  Button,
  Heading,
  HeroIcons,
  Paragraph,
  ScrollView,
  Spacer,
  useIsAccessibilityTextSize,
  XStack,
  YStack,
} from '@package/ui'
import {
  type FormattedSubmission,
  type FormattedTransactionDataPaso,
  getDisclosedAttributeNamesForDisplay,
  hasMissingCards,
} from '@paradym/wallet-sdk'
import { type ReactNode, useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { CardSelectionSheet } from '../components/CardSelectionSheet'
import { PasoDetailsSheet } from '../components/PasoDetailsSheet'
import { PasoDetailsRow, PasoTransactionFrame, SwitchAccountButton } from '../components/PasoTransactionFrame'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'
import { useTransactionDataSeen } from '../useTransactionDataSeen'

interface PasoConsentSlideProps {
  transaction: FormattedTransactionDataPaso
  verifierName: string
  submission?: FormattedSubmission
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  /** Whether `transaction` is being resolved again for a newly picked card. */
  isResolvingTransaction?: boolean
  onSelectCredential?: (inputDescriptorId: string, credentialRecordId: string) => void
}

/**
 * The PaSO consent screen: the WPA Rulebook v1.1 Section 4.7.2 hierarchy for a payment, and the
 * generic rendering of [PaSO View] Section 2 for every other type.
 *
 * - [PaSO Core] Section 5.3 / [PaSO View] Section 2: the confirmation action stays disabled until
 *   everything the user consents to has been on screen: the issuer frame with levels 1–6, and any card
 *   that is shared along with it.
 * - The amount and payee sit at the top of the scroll area, so they're on the first screen without
 *   scrolling in the default text size.
 * - Nothing is shortened. At accessibility text sizes the actions move into the scroll area, after
 *   the content, so they wrap freely and can't hide any of it.
 */
export const PasoConsentSlide = ({
  transaction,
  verifierName,
  submission,
  onAccept,
  onDecline,
  isAccepting,
  isResolvingTransaction = false,
  onSelectCredential,
}: PasoConsentSlideProps) => {
  const { onNext, onCancel, confirmCombined } = useWizard()
  const { t } = useLingui()
  const isAccessibilityTextSize = useIsAccessibilityTextSize()
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const [isCardSheetOpen, setIsCardSheetOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Every card that can authorize the transaction. The first is the one it was resolved against and
  // will be presented; picking another moves it to the front (`selectSubmissionCredentials`).
  const paymentCards =
    submission?.entries.find(
      (entry): entry is typeof entry & { isSatisfied: true } =>
        entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
    )?.credentials ?? []
  const cardForPayment = paymentCards[0]

  // The other cards the request asks for, shared along with the payment.
  const otherEntries =
    submission?.entries.filter((entry) => entry.inputDescriptorId !== transaction.cardForTransactionId) ?? []
  const sharedDetailCount = otherEntries.reduce(
    (count, entry) =>
      count + (entry.isSatisfied ? getDisclosedAttributeNamesForDisplay(entry.credentials[0]).length : 0),
    0
  )

  const payee = transaction.type === 'paso_claims' ? undefined : transaction.payee.value
  const isRequestedForPayee = !payee || verifierName.trim().toLowerCase() === payee.trim().toLowerCase()

  const { hasSeenTransactionData, onTransactionDataLayout, onViewportLayout, onScroll } = useTransactionDataSeen()
  const handleScrollEvent = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event)
    onScroll(event)
  }

  const handleAccept = async () => {
    // Next to a step that asks for a confirmation first, accepting waits for it
    if (confirmCombined && !(await confirmCombined())) return
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const actions: ReactNode = submission?.areAllSatisfied ? (
    <YStack gap="2">
      {!hasSeenTransactionData && (
        <XStack items="center" justify="center" gap="1.5">
          <HeroIcons.ChevronDown size={16} color="grey-600" />
          <Paragraph variant="annotation" text="center" flexShrink={1}>
            {t({
              id: 'paso.consent.scrollToConfirm',
              message: 'Scroll to review all payment details',
              comment: 'Shown while the user has not yet scrolled through all payment details',
            })}
          </Paragraph>
        </XStack>
      )}
      {hasSeenTransactionData && sharedDetailCount > 0 && (
        <Paragraph variant="annotation" text="center">
          {t({
            id: 'paso.payment.alsoSharesDetails',
            message: plural(sharedDetailCount, {
              one: `Confirming also shares # detail with ${verifierName}.`,
              other: `Confirming also shares # details with ${verifierName}.`,
            }),
            comment: 'Shown above the buttons when confirming a payment also shares details from other cards',
          })}
        </Paragraph>
      )}
      <DualResponseButtons
        align={isAccessibilityTextSize ? 'vertical' : 'horizontal'}
        // [PaSO View] Section 2: the issuer's labels may not be truncated, so they wrap, and the
        // buttons stack at full width, primary on top, when they do not fit side by side.
        wrapLabels
        acceptText={
          transaction.affirmativeActionLabel ??
          t({
            id: 'paso.consent.accept',
            message: 'Confirm',
            comment: 'Fallback label for the button that authorizes a PaSO transaction',
          })
        }
        declineText={transaction.denialActionLabel ?? t(commonMessages.cancel)}
        onAccept={handleAccept}
        onDecline={onCancel}
        isLoading={isProcessing}
        isAcceptDisabled={!hasSeenTransactionData || isResolvingTransaction}
        variant={confirmCombined ? 'confirmation' : 'regular'}
      />
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
  )

  return (
    <YStack grow={1} justify="space-between">
      <YStack gap="3" grow={1}>
        {/* The wallet's own title, outside the issuer frame, when the issuer gives none. */}
        {!transaction.transactionTitle && (
          <Heading>
            {t({
              id: 'paso.payment.fallbackTitle',
              message: 'Review and confirm',
              comment: 'Title of a payment or authorization screen when the bank supplies no title',
            })}
          </Heading>
        )}

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
            contentContainerStyle={{ gap: '5' }}
            px="5"
            py="4"
          >
            {/* Everything the user consents to, measured as one block. */}
            <YStack gap="6" onLayout={onTransactionDataLayout}>
              <PasoTransactionFrame
                transaction={transaction}
                card={cardForPayment}
                issuer={{
                  name: cardForPayment?.credential.display.issuer.name ?? t(commonMessages.unknownOrganization),
                  logoUrl: cardForPayment?.credential.display.issuer.logo?.url,
                }}
                artwork={cardForPayment && credentialSvgArtwork(cardForPayment.credential.display.svg)}
                accountAction={
                  paymentCards.length > 1 && (
                    <SwitchAccountButton
                      disabled={isProcessing || isResolvingTransaction}
                      onPress={() => setIsCardSheetOpen(true)}
                    />
                  )
                }
              />

              {submission && otherEntries.length > 0 && (
                <RequestedAttributesSection
                  submission={{ ...submission, entries: otherEntries }}
                  onSelectCredential={onSelectCredential}
                  satisfiedIntro={{
                    heading: t({
                      id: 'paso.payment.alsoSharedHeading',
                      message: `ALSO SHARED WITH ${verifierName.toUpperCase()}`,
                      comment: 'Heading above the cards shared along with a payment',
                    }),
                    description: t({
                      id: 'paso.payment.alsoSharedDescription',
                      message: 'Confirming also shares these details from your cards.',
                      comment: 'Explains that confirming the payment also shares the cards listed below',
                    }),
                  }}
                />
              )}
            </YStack>

            <PasoDetailsRow
              subtitle={
                isRequestedForPayee
                  ? undefined
                  : t({
                      id: 'paso.details.requestedByFor',
                      message: `Requested by ${verifierName} for ${payee}`,
                      comment: 'Shown in the details row when the payment is requested by someone else than the payee',
                    })
              }
              onPress={() => setIsDetailsOpen(true)}
            />

            {isAccessibilityTextSize ? actions : <Spacer size="2" />}
          </ScrollView>
        </YStack>
      </YStack>

      {!isAccessibilityTextSize && (
        <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5" bg="background">
          {actions}
        </YStack>
      )}

      <PasoDetailsSheet
        isOpen={isDetailsOpen}
        setIsOpen={setIsDetailsOpen}
        requestedBy={verifierName}
        details={transaction.details ?? []}
      />

      {cardForPayment && (
        <CardSelectionSheet
          isOpen={isCardSheetOpen}
          setIsOpen={setIsCardSheetOpen}
          title={t({
            id: 'paso.consent.chooseAccountTitle',
            message: 'Choose a paying account',
            comment: 'Title of the sheet where the user picks the account to authorize a payment with',
          })}
          cards={paymentCards}
          selectedCardId={cardForPayment.credential.record.id}
          onSelect={(credentialRecordId) => onSelectCredential?.(transaction.cardForTransactionId, credentialRecordId)}
        />
      )}
    </YStack>
  )
}
