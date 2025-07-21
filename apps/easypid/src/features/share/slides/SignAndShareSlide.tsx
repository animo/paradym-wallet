import { type FormattedSubmission, type QtspInfo, getDisclosedAttributeNamesForDisplay } from '@package/agent'
import { CardWithAttributes, DualResponseButtons, MiniDocument, useScrollViewPosition } from '@package/app'
import { useWizard } from '@package/app'
import { Button, Heading, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import { useState } from 'react'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'
import { commonMessages } from '@package/translations'
import { Trans, useLingui } from '@lingui/react/macro'

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
  const { t } = useLingui()

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

  const signingWithLabel = t({
    id: 'signShare.signingWith',
    message: `Signing with ${qtsp.name}`,
    comment: 'Shown under the document name to indicate which QTSP is used for signing',
  })

  const acceptLabel = t({
    id: 'signShare.accept',
    message: 'Sign & share',
    comment: 'Button label for accepting a sign-and-share request',
  })

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$4" fg={1}>
        <Heading>
          <Trans id="signShare.title" comment="Main heading in the sign & share screen">
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
                <Heading variant="sub2">
                  <Trans id="signShare.documentHeading" comment="Heading above the document name">
                    Document
                  </Trans>
                </Heading>
                <Paragraph>
                  <Trans id="signShare.documentIntro" comment="Text above the document to be signed">
                    The following document will be signed.
                  </Trans>
                </Paragraph>
              </YStack>
              <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                <YStack f={1} gap="$2">
                  <Heading variant="sub2" textTransform="none" color="$grey-800">
                    {documentName}
                  </Heading>
                  <Paragraph>{signingWithLabel}</Paragraph>
                </YStack>
                <MiniDocument logoUrl={qtsp.logo?.url} />
              </XStack>
            </YStack>

            {cardForSigning && (
              <YStack gap="$4">
                <YStack gap="$2">
                  <Heading variant="sub2">
                    <Trans id="signShare.cardHeading" comment="Heading above the signing card">
                      Signing card
                    </Trans>
                  </Heading>
                  <Paragraph>
                    <Trans id="signShare.cardIntro" comment="Explains which info will be used to sign">
                      The following personal information will be used to sign the document.
                    </Trans>
                  </Paragraph>
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
            acceptText={acceptLabel}
            declineText={t(commonMessages.stop)}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isLoading={isProcessing}
          />
        ) : (
          <YStack gap="$3">
            <Paragraph variant="sub" fontWeight="$medium" ta="center" color="$danger-500">
              <Trans id="signShare.missingCards" comment="Shown when the user lacks the required credentials">
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
