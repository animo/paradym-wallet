import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { Trans, useLingui } from '@lingui/react/macro'
import type { DisplayImage, FormattedSubmission } from '@package/agent'
import { DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, MessageBox, Paragraph, ScrollView, YStack } from '@package/ui'
import { useState } from 'react'
import { Spacer } from 'tamagui'
import { RequestPurposeSection } from '../components/RequestPurposeSection'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface ShareCredentialsSlideProps {
  logo?: DisplayImage
  onAccept?: () => Promise<void>
  onDecline: () => void
  submission: FormattedSubmission
  isAccepting: boolean
  isOffline?: boolean
  overAskingResponse?: OverAskingResponse
}

export const ShareCredentialsSlide = ({
  logo,
  submission,
  onAccept,
  onDecline,
  isAccepting,
  isOffline,
  overAskingResponse,
}: ShareCredentialsSlideProps) => {
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

  const fallbackPurpose = t({
    id: 'submission.fallbackPurpose',
    message: 'No information was provided on the purpose of the data request. Be cautious',
    comment: 'Shown when a submission has no stated purpose',
  })

  const shareLabel = t({
    id: 'submission.share',
    message: 'Share',
    comment: 'Button label to accept and share credentials',
  })

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4" fg={1}>
        <Heading>
          <Trans id="submission.reviewTitle" comment="Heading shown at the top of the share credentials screen">
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
            ) : (
              <RequestPurposeSection
                purpose={submission.purpose ?? fallbackPurpose}
                overAskingResponse={
                  submission.areAllSatisfied ? overAskingResponse : { validRequest: 'could_not_determine', reason: '' }
                }
                logo={logo}
              />
            )}
            <RequestedAttributesSection submission={submission} />
            <Spacer />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        {submission.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText={shareLabel}
            declineText={t(commonMessages.stop)}
            onAccept={handleAccept}
            onDecline={onCancel}
            isLoading={isProcessing}
          />
        ) : (
          <YStack gap="$3">
            <Paragraph variant="sub" fontWeight="$medium" ta="center" color="$danger-500">
              <Trans id="submission.missingCardsWarning" comment="Shown when user lacks required credentials">
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
