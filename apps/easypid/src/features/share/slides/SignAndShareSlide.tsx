import { type FormattedSubmission, getDisclosedAttributeNamesForDisplay } from '@package/agent'
import { CardWithAttributes, DualResponseButtons, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, Image, Paragraph, ScrollView, Spacer, Stack, XStack, YStack } from '@package/ui'
import { useState } from 'react'

interface SignAndShareSlideProps {
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  qtspName: string
  qtspLogo?: string
  documentName: string
  submission?: FormattedSubmission
}

export const SignAndShareSlide = ({
  onAccept,
  onDecline,
  isAccepting,
  qtspName,
  qtspLogo,
  documentName,
  submission,
}: SignAndShareSlideProps) => {
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

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  // FIXME: We should extract the card used for signing
  // In future, we can use <RequestedAttributesSection /> below to render the rest of the requested cards
  const cardForSigning = submission?.entries.find((entry) => entry.isSatisfied)?.credentials[0]

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
            <YStack gap="$4">
              <YStack gap="$2">
                <Heading variant="sub2">Document</Heading>
                <Paragraph>The following document will be signed.</Paragraph>
              </YStack>
              <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" p="$4">
                <YStack f={1} gap="$2">
                  <Heading variant="sub1">{documentName}</Heading>
                  <Paragraph>Signing with {qtspName}</Paragraph>
                </YStack>
                <YStack w="$5" rotate="3deg" shadow>
                  <YStack bg="$white" p="$2" gap="$2" br="$3" bw={1} borderColor="$grey-200">
                    {!qtspLogo ? (
                      <Stack ai="center" h="$1" br="$2" bg="$grey-200" />
                    ) : (
                      <Stack ai="center" h="$1" br="$2" bg="$primary-200">
                        <Stack pos="absolute">
                          <Image
                            src="https://logos-world.net/wp-content/uploads/2024/05/DocuSign-Symbol.png"
                            height={20}
                            width={20}
                          />
                        </Stack>
                      </Stack>
                    )}
                    <YStack gap="$1.5">
                      <Stack h="$0.5" br="$2" bg="$grey-100" />
                      <Stack h="$0.5" br="$2" bg="$grey-100" />
                      <Stack h="$0.5" br="$2" bg="$grey-100" />
                    </YStack>
                  </YStack>
                </YStack>
              </XStack>
            </YStack>
            <YStack gap="$4">
              <YStack gap="$2">
                <Heading variant="sub2">Signing card</Heading>
                <Paragraph>The following personal information will be used to sign the document.</Paragraph>
              </YStack>
              {cardForSigning && (
                <CardWithAttributes
                  id={cardForSigning.credential.id}
                  name={cardForSigning.credential.display.name}
                  backgroundImage={cardForSigning.credential.display.backgroundImage}
                  backgroundColor={cardForSigning.credential.display.backgroundColor}
                  issuerImage={cardForSigning.credential.display.issuer.logo}
                  textColor={cardForSigning.credential.display.textColor}
                  formattedDisclosedAttributes={getDisclosedAttributeNamesForDisplay(cardForSigning)}
                  disclosedPayload={cardForSigning.disclosed.attributes}
                  isExpired={
                    cardForSigning.credential.metadata?.validUntil
                      ? new Date(cardForSigning.credential.metadata.validUntil) < new Date()
                      : false
                  }
                  isNotYetActive={
                    cardForSigning.credential.metadata?.validFrom
                      ? new Date(cardForSigning.credential.metadata.validFrom) > new Date()
                      : false
                  }
                />
              )}
            </YStack>
            {/* <RequestedAttributesSection submission={submission} /> */}
            <Spacer />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        {submission?.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText="Share"
            declineText="Stop"
            onAccept={handleAccept}
            onDecline={handleDecline}
            isLoading={isProcessing}
          />
        ) : (
          <YStack gap="$3">
            <Paragraph variant="sub" fontWeight="$medium" ta="center" color="$danger-500">
              You don't have the required cards
            </Paragraph>
            <Button.Solid onPress={onDecline}>Close</Button.Solid>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
