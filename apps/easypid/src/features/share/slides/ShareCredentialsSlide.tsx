import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import type { DisplayImage, FormattedSubmission } from '@package/agent'
import { DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, HeroIcons, MessageBox, ScrollView, YStack } from '@package/ui'
import { useState } from 'react'
import { Spacer } from 'tamagui'
import { RequestPurposeSection } from '../components/RequestPurposeSection'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface ShareCredentialsSlideProps {
  logo?: DisplayImage
  onAccept?: () => Promise<void>
  onDecline?: () => void
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

  const handleAccept = async () => {
    // Manually set to instantly show the loading state
    setIsProcessing(true)

    await onAccept?.()
    onNext()
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4" fg={1}>
        <Heading>Review the request</Heading>
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
                title="This is an offline request"
                message="Information about the verifier could not be shown. Carefully consider if you trust this party."
                icon={<HeroIcons.ExclamationTriangleFilled />}
              />
            ) : (
              <RequestPurposeSection
                purpose={
                  submission.purpose ?? 'No information was provided on the purpose of the data request. Be cautious'
                }
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
            acceptText="Share"
            declineText="Stop"
            onAccept={handleAccept}
            onDecline={onCancel}
            isLoading={isProcessing}
          />
        ) : (
          <Button.Solid onPress={onDecline}>Close</Button.Solid>
        )}
      </YStack>
    </YStack>
  )
}
