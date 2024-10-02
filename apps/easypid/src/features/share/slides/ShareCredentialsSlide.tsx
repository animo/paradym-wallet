import type { FormattedSubmission } from '@package/agent'
import { DualResponseButtons, RequestedAttributesSection } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, HeroIcons, Paragraph, ScrollView, Stack, YStack } from '@package/ui'
import { useState } from 'react'
import { Circle } from 'tamagui'

interface ShareCredentialsSlideProps {
  onAccept?: () => Promise<void>
  submission?: FormattedSubmission
  onDecline: () => void
  verifierHost: string
  isAccepting: boolean
}

export const ShareCredentialsSlide = ({
  submission,
  onAccept,
  onDecline,
  verifierHost,
  isAccepting,
}: ShareCredentialsSlideProps) => {
  const { onNext } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

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
        <Heading>Do you want to share with Party X?</Heading>
        <YStack
          fg={1}
          onLayout={(event) => {
            if (!scrollViewHeight) setScrollViewHeight(event.nativeEvent.layout.height)
          }}
        >
          <ScrollView contentContainerStyle={{ gap: '$6' }} px="$4" mx="$-4" maxHeight={scrollViewHeight} bg="$white">
            <RequestedAttributesSection submission={submission} />
            <YStack gap="$2">
              <Circle size="$2" mb="$2" backgroundColor="$primary-500">
                <HeroIcons.InformationCircle color="$white" size={18} />
              </Circle>
              <Heading variant="h3" fontWeight="$semiBold">
                Reason for request
              </Heading>
              <Paragraph size="$3" secondary>
                {submission.purpose ??
                  submission.entries[0].description ??
                  'No information was provided on the purpose of the data request. Be cautious'}
              </Paragraph>
            </YStack>
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
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
