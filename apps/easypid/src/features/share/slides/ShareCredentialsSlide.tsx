import { getOpenIdFedIssuerMetadata } from '@easypid/utils/issuer'
import type { DisplayImage, FormattedSubmission } from '@package/agent'
import { DualResponseButtons, usePushToWallet, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import {
  Button,
  Circle,
  Heading,
  HeroIcons,
  Image,
  MessageBox,
  Paragraph,
  ScrollView,
  Stack,
  XStack,
  YStack,
  useToastController,
} from '@package/ui'
import { useState } from 'react'
import { Spacer } from 'tamagui'
import type { PresentationRequestResult } from '../FunkeOpenIdPresentationNotificationScreen'
import { RequestPurposeSection } from '../components/RequestPurposeSection'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface ShareCredentialsSlideProps {
  logo?: DisplayImage

  onAccept?: () => Promise<PresentationRequestResult>
  submission?: FormattedSubmission
  onDecline: () => void
  verifierName?: string
  isAccepting: boolean
}

export const ShareCredentialsSlide = ({
  logo,
  submission,
  onAccept,
  onDecline,
  verifierName,
  isAccepting,
}: ShareCredentialsSlideProps) => {
  const { onNext } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const pushToWallet = usePushToWallet()
  const toast = useToastController()

  if (!submission) {
    toast.show('No credentials to share!', { customData: { preset: 'danger' } })
    pushToWallet()
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
            <RequestPurposeSection
              purpose={
                submission.purpose ?? 'No information was provided on the purpose of the data request. Be cautious'
              }
              logo={logo}
            />
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
