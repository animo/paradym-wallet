import type { FormattedSubmission } from '@package/agent'
import { DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'
import { Spacer } from 'tamagui'
import type { PresentationRequestResult } from '../FunkeOpenIdPresentationNotificationScreen'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface ShareCredentialsSlideProps {
  onAccept?: () => Promise<PresentationRequestResult>
  submission?: FormattedSubmission
  onDecline: () => void
  verifierName?: string
  isAccepting: boolean
}

export const ShareCredentialsSlide = ({
  submission,
  onAccept,
  onDecline,
  verifierName,
  isAccepting,
}: ShareCredentialsSlideProps) => {
  const { onNext } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()

  if (!submission) {
    return null
  }

  const handleAccept = async () => {
    if (onAccept) {
      await onAccept()
    }
    onNext()
  }

  const handleDecline = () => {
    onDecline()
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1}>
        <Heading>Do you want to share{verifierName && ` with ${verifierName}`}?</Heading>
        <YStack
          fg={1}
          btw="$0.5"
          px="$4"
          mx="$-4"
          borderColor={isScrolledByOffset ? '$grey-200' : '$background'}
          onLayout={(event) => {
            if (!scrollViewHeight) setScrollViewHeight(event.nativeEvent.layout.height)
          }}
        >
          <ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            contentContainerStyle={{ gap: '$6' }}
            px="$4"
            mx="$-4"
            maxHeight={scrollViewHeight}
            bg="$white"
          >
            <YStack gap="$2">
              <Heading variant="sub1" fontWeight="$semiBold">
                Reason for request
              </Heading>
              <XStack gap="$4" bg="$grey-50" br="$8" p="$4" bw="$0.5" borderColor="$grey-100">
                <Stack>
                  <XStack p="$3" bg="$grey-200" borderRadius="$4">
                    <HeroIcons.BuildingOffice color="$grey-800" />
                  </XStack>
                </Stack>
                <Paragraph numberOfLines={5} f={1} variant="sub">
                  {submission.purpose ??
                    submission.entries[0].description ??
                    'No information was provided on the purpose of the data request. Be cautious'}
                </Paragraph>
              </XStack>
            </YStack>
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
            onDecline={handleDecline}
            isLoading={isAccepting}
          />
        ) : (
          <YStack gap="$3">
            <Paragraph variant="sub" ta="center">
              You don't have the required credentials
            </Paragraph>
            <Button.Solid onPress={onDecline}>Close</Button.Solid>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
