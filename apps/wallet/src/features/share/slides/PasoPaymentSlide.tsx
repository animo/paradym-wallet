import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  Button,
  Circle,
  Heading,
  HeroIcons,
  Image,
  MiniCardRowItem,
  Paragraph,
  ScrollView,
  Spacer,
  XStack,
  YStack,
} from '@package/ui'
import {
  type DisplayImage,
  type FormattedSubmission,
  type FormattedTransactionDataPasoPayment,
  hasMissingCards,
} from '@paradym/wallet-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface PasoPaymentSlideProps {
  transaction: FormattedTransactionDataPasoPayment
  verifier: { name: string; logo?: DisplayImage }
  submission?: FormattedSubmission
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
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
}: PasoPaymentSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const { t } = useLingui()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [hasSeenTransactionData, setHasSeenTransactionData] = useState(false)
  const [isProcessing, setIsProcessing] = useState(isAccepting)

  // The Attestation Provider's labels normally name these claims, in the locale the proof reports.
  // The fallbacks are for the one case where there is no card and so no metadata to read them from.
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

  const cardForPayment = submission?.entries.find(
    (entry): entry is typeof entry & { isSatisfied: true } =>
      entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
  )?.credentials[0]

  /**
   * [PaSO Core] Section 5.3 and [PaSO View] Section 2: the claims designated for display, and the
   * `security_hint`, have to have been *shown* before the confirmation action is enabled.
   *
   * What has to have been seen is the transaction data — not the bottom of the screen. The card
   * preview and the requested attributes below it are not transaction data, so gating on reaching the
   * end of the scroll area asks for more than the rule does. It also breaks: when the content happens
   * to fit there is nothing to scroll, so an escape hatch has to recognise that, and if the
   * measurement behind it never reports the user is left with a confirmation action that can never
   * be enabled and nothing on screen explaining why.
   *
   * Hence two things. The measurement is of the transaction data block itself — `y + height` is where
   * it ends within the scrollable content — and *three* independent measurements feed how much of the
   * content has been seen: the container height, the scroll view's own height, and the visible region
   * reported while scrolling. Any one of them opens the gate, so no single platform callback failing
   * to fire can wedge the screen. On a normal screen the block is in view from the first layout and
   * the action is enabled immediately; on a small one, or with large accessibility text, it correctly
   * takes a scroll.
   */
  const transactionDataEnd = useRef<number | undefined>(undefined)
  const seenContentDepth = useRef(0)

  // The content container's vertical padding sits between the block's own coordinates and the
  // measurements of the viewport, so the comparison carries a tolerance rather than depending on the
  // exact value of the padding token.
  const measurementTolerance = 24

  const markSeen = useCallback((contentDepth: number) => {
    seenContentDepth.current = Math.max(seenContentDepth.current, contentDepth)

    const end = transactionDataEnd.current
    if (end !== undefined && seenContentDepth.current + measurementTolerance >= end) {
      setHasSeenTransactionData(true)
    }
  }, [])

  useEffect(() => {
    if (scrollViewHeight > 0) markSeen(scrollViewHeight)
  }, [scrollViewHeight, markSeen])

  const onTransactionDataLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout
    transactionDataEnd.current = y + height
    markSeen(0)
  }

  const onScrollViewLayout = (event: LayoutChangeEvent) => markSeen(event.nativeEvent.layout.height)

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event)
    const { contentOffset, layoutMeasurement } = event.nativeEvent
    markSeen(contentOffset.y + layoutMeasurement.height)
  }

  const handleAccept = async () => {
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4" fg={1}>
        <Heading>{transaction.transactionTitle ?? t(commonMessages.paymentHeading)}</Heading>

        <YStack
          fg={1}
          px="$4"
          mx="$-4"
          onLayout={(event) => {
            if (!scrollViewHeight) setScrollViewHeight(event.nativeEvent.layout.height)
          }}
          btw="$0.5"
          borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
        >
          <ScrollView
            onScroll={onScroll}
            onLayout={onScrollViewLayout}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={{ gap: '$6' }}
            px="$4"
            mx="$-4"
            py="$4"
            maxHeight={scrollViewHeight}
          >
            {/* Everything PaSO requires to have been displayed, measured as one block. */}
            <YStack gap="$4" onLayout={onTransactionDataLayout}>
              <XStack ai="center" px="$6" jc="center" flexDirection="column">
                <Circle size={88} bw="$0.5" borderColor="$grey-100" bg="$white">
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
                    <HeroIcons.BuildingOffice color="$grey-800" size={36} />
                  )}
                </Circle>
                <Paragraph variant="sub" ta="center">
                  <Trans
                    id="paso.payment.description"
                    comment="Explanation that the user is about to authorize a payment"
                  >
                    {verifier.name} wants you to authorize a payment.
                  </Trans>
                </Paragraph>
              </XStack>

              {/* The rulebook claims, in the normative claim order: amount, payee, payee logo. */}
              <YStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                <YStack gap="$1" ai="center">
                  <Paragraph variant="annotation">{transaction.amount.label ?? amountFallbackLabel}</Paragraph>
                  <Heading textTransform="none" color="$grey-800">
                    {transaction.amount.value}
                  </Heading>
                </YStack>
              </YStack>

              <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
                <YStack f={1} gap="$1">
                  <Paragraph variant="annotation">{transaction.payee.label ?? payeeFallbackLabel}</Paragraph>
                  <Heading heading="h3" textTransform="none" color="$grey-800">
                    {transaction.payee.value}
                  </Heading>
                </YStack>
                {transaction.payeeLogo && (
                  <Circle size={60} bw="$0.5" borderColor="$grey-100" bg="$white">
                    <Image
                      src={transaction.payeeLogo.dataUrl}
                      alt={transaction.payeeLogo.label ?? payeeFallbackLabel}
                      height="100%"
                      width="100%"
                      contentFit="contain"
                    />
                  </Circle>
                )}
              </XStack>

              {/* Shown exactly as the Attestation Provider wrote it. Never translated, never edited. */}
              {transaction.securityHint && (
                <XStack br="$6" bg="$warning-300" bw={1} borderColor="$warning-400" gap="$3" p="$4" ai="flex-start">
                  <HeroIcons.ExclamationTriangleFilled color="$warning-600" size={20} />
                  <Paragraph f={1} variant="sub" size="$2" color="$grey-900">
                    {transaction.securityHint}
                  </Paragraph>
                </XStack>
              )}
            </YStack>

            {/* Below here is context, not transaction data: which card pays, and what else is asked. */}
            {cardForPayment && (
              <YStack gap="$2">
                <Heading heading="sub2">
                  <Trans id="paso.payment.cardHeading" comment="Heading above the card used to authorize a payment">
                    Payment card
                  </Trans>
                </Heading>
                <MiniCardRowItem
                  name={cardForPayment.credential.display.name ?? t(commonMessages.unknown)}
                  backgroundImageUri={cardForPayment.credential.display.backgroundImage?.url}
                  backgroundColor={cardForPayment.credential.display.backgroundColor ?? '$white'}
                  issuerImageUri={cardForPayment.credential.display.issuer.logo?.url}
                  subtitle={cardForPayment.credential.display.issuer.name ?? t(commonMessages.unknown)}
                />
              </YStack>
            )}

            {submission && <RequestedAttributesSection submission={submission} />}
            <Spacer />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        {submission?.areAllSatisfied ? (
          <YStack gap="$2">
            <DualResponseButtons
              align="horizontal"
              acceptText={
                transaction.affirmativeActionLabel ??
                t({
                  id: 'paso.payment.accept',
                  message: 'Pay',
                  comment: 'Fallback label for the button that authorizes a PaSO payment',
                })
              }
              declineText={transaction.denialActionLabel ?? t(commonMessages.stop)}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isLoading={isProcessing}
              isAcceptDisabled={!hasSeenTransactionData}
            />
            {!hasSeenTransactionData && (
              <Paragraph variant="annotation" ta="center">
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
          <YStack gap="$3">
            <Paragraph variant="sub" fontWeight="$medium" ta="center" color="$danger-500">
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
    </YStack>
  )
}
