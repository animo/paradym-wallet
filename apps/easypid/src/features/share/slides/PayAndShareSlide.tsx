import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import type { FormattedSubmission, FormattedTransactionDataPaymentSingle } from '@paradym/wallet-sdk'
import { useState } from 'react'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface PayAndShareSlideProps {
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  transaction: FormattedTransactionDataPaymentSingle
  submission?: FormattedSubmission
}

export const PayAndShareSlide = ({
  onAccept,
  onDecline,
  isAccepting,
  transaction,
  submission,
}: PayAndShareSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const { t } = useLingui()

  const handleAccept = async () => {
    // Manually set to instantly show the loading state
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  const acceptLabel = t({
    id: 'payShare.accept',
    message: 'Pay & share',
    comment: 'Button label for accepting a pay-and-share request',
  })

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4" fg={1}>
        <Heading>
          <Trans id="payShare.title" comment="Main heading in the pay & share screen">
            Review the request
          </Trans>
        </Heading>

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
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={{ gap: '$6' }}
            px="$4"
            mx="$-4"
            pt="$4"
            maxHeight={scrollViewHeight}
            bg="$white"
          >
            <YStack gap="$4">
              <YStack gap="$2">
                <Heading heading="sub2">
                  <Trans id="payShare.documentHeading" comment="Heading above the document name">
                    Payment
                  </Trans>
                </Heading>
                <Paragraph>
                  <Trans id="payShare.documentIntro" comment="Text above the payment to be paid">
                    The following payment will be authorized
                  </Trans>
                </Paragraph>
              </YStack>
              <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                <YStack f={1} gap="$2" ai="center">
                  <Heading textTransform="none" color="$grey-800">
                    {transaction.amount}
                  </Heading>
                  <Paragraph variant="sub" size="$2">
                    {/* TODO: derive payment network from SCA */}
                    <Trans>Paying with iDeal | Wero</Trans>
                  </Paragraph>
                </YStack>
              </XStack>
            </YStack>
            {submission && <RequestedAttributesSection submission={submission} />}
            <Spacer />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        {submission?.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText={acceptLabel}
            declineText={t(commonMessages.stop)}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isLoading={isProcessing}
          />
        ) : (
          <YStack gap="$3">
            <Paragraph variant="sub" fontWeight="$medium" ta="center" color="$danger-500">
              <Trans id="payShare.missingCards" comment="Shown when the user lacks the required credentials">
                You don't have the required cards
              </Trans>
            </Paragraph>
            <Button.Solid onPress={onDecline}>{t(commonMessages.close)}</Button.Solid>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
