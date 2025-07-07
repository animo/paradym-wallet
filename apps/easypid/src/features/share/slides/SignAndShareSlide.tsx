import { type FormattedSubmission, type QtspInfo, getDisclosedAttributeNamesForDisplay } from '@package/agent'
import { CardWithAttributes, DualResponseButtons, MiniDocument, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import { useState } from 'react'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface SignAndShareSlideProps {
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  qtsp: QtspInfo
  documentName: string
  cardForSigningId?: string
  submission?: FormattedSubmission
}

export const SignAndShareSlide = ({
  onAccept,
  onDecline,
  isAccepting,
  qtsp,
  documentName,
  cardForSigningId,
  submission,
}: SignAndShareSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)

  const cardForSigning = submission?.entries.find(
    (entry): entry is typeof entry & { isSatisfied: true } =>
      entry.inputDescriptorId === cardForSigningId && entry.isSatisfied
  )?.credentials[0]
  const remainingEntries =
    (cardForSigning
      ? submission?.entries.filter((entry) => entry.inputDescriptorId !== cardForSigningId)
      : submission?.entries) ?? []

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
              <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                <YStack f={1} gap="$2">
                  <Heading variant="sub2" textTransform="none" color="$grey-800">
                    {documentName}
                  </Heading>
                  <Paragraph>Signing with {qtsp.name}</Paragraph>
                </YStack>
                <MiniDocument logoUrl={qtsp.logo?.url} />
              </XStack>
            </YStack>
            {cardForSigning && (
              <YStack gap="$4">
                <YStack gap="$2">
                  <Heading variant="sub2">Signing card</Heading>
                  <Paragraph>The following personal information will be used to sign the document.</Paragraph>
                </YStack>

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
              </YStack>
            )}
            {remainingEntries.length > 0 && submission && (
              <RequestedAttributesSection submission={{ ...submission, entries: remainingEntries }} />
            )}
            <Spacer />
          </ScrollView>
        </YStack>
      </YStack>

      <YStack btw="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4" bg="$background">
        {submission?.areAllSatisfied ? (
          <DualResponseButtons
            align="horizontal"
            acceptText="Sign & share"
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
