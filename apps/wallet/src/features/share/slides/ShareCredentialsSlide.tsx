import { getUnmetAttributeMessages } from '@app/utils/unmetAttributeMessages'
import { useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, MessageBox, Paragraph, ScrollView, YStack } from '@package/ui'
import { type DisplayImage, type FormattedSubmission, hasMissingCards } from '@paradym/wallet-sdk'
import { useState } from 'react'
import { Spacer } from 'tamagui'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'
import { RequestPurposeSection } from '../components/RequestPurposeSection'

interface ShareCredentialsSlideProps {
  logo?: DisplayImage
  onAccept?: () => Promise<void>
  onDecline: () => void
  submission: FormattedSubmission
  isAccepting: boolean
  isOffline?: boolean
  onSelectCredential?: (inputDescriptorId: string, credentialRecordId: string) => void
}

export const ShareCredentialsSlide = ({
  logo,
  submission,
  onAccept,
  onDecline,
  isAccepting,
  isOffline,
  onSelectCredential,
}: ShareCredentialsSlideProps) => {
  const { onNext, onCancel, confirmCombined } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const { t } = useLingui()

  const handleAccept = async () => {
    // Next to a step that asks for a confirmation first, sharing waits for it
    if (confirmCombined && !(await confirmCombined())) return

    // Manually set to instantly show the loading state
    setIsProcessing(true)

    await onAccept?.()
    onNext()
  }

  const shareLabel = t(commonMessages.share)

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
            {isOffline ? (
              <MessageBox
                variant="light"
                title={t({
                  id: 'submission.offlineRequestTitle',
                  message: 'This is an offline request',
                  comment: 'Title shown for offline message',
                })}
                message={t({
                  id: 'submission.offlineRequestDescription',
                  message:
                    'Information about the verifier could not be shown. Carefully consider if you trust this organization.',
                  comment: 'Message shown when the request is offline and verifier is unknown',
                })}
                icon={<HeroIcons.ExclamationTriangleFilled />}
              />
            ) : submission.purpose ? (
              <RequestPurposeSection purpose={submission.purpose} logo={logo} />
            ) : null}
            <RequestedAttributesSection submission={submission} onSelectCredential={onSelectCredential} />
            <Spacer size="5" />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5" bg="background">
        {submission.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText={shareLabel}
            onAccept={handleAccept}
            onDecline={onCancel}
            isLoading={isProcessing}
            variant={confirmCombined ? 'confirmation' : 'regular'}
          />
        ) : (
          <YStack gap="3">
            <Paragraph variant="sub" fontWeight="medium" text="center" color="danger-500">
              {t(
                hasMissingCards(submission)
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
