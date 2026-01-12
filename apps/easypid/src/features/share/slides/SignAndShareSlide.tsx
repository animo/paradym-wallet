import { Trans, useLingui } from '@lingui/react/macro'
import {
  type FormattedSubmission,
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  type QesTransactionDataEntry,
  type QtspInfo,
} from '@package/agent'
import { CardWithAttributes, DualResponseButtons, MiniDocument, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, Paragraph, ScrollView, Spacer, XStack, YStack } from '@package/ui'
import { useState } from 'react'
import { RequestedAttributesSection } from '../components/RequestedAttributesSection'

interface SignAndShareSlideProps {
  onAccept?: () => Promise<void>
  onDecline?: () => void
  isAccepting: boolean
  submission?: FormattedSubmission
  formattedTransactionData?: FormattedTransactionData
  selectedTransactionData?: {
    credentialId?: string
    additionalPayload?: object
  }[]
}

export const SignAndShareSlide = ({
  onAccept,
  onDecline,
  isAccepting,
  submission,
  formattedTransactionData,
  selectedTransactionData,
}: SignAndShareSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const { t } = useLingui()

  const qesTransactions =
    formattedTransactionData?.flatMap((entry, index) =>
      entry.type === 'qes_authorization' ? [{ entry: entry as QesTransactionDataEntry, index }] : []
    ) ?? []

  const signingCards = qesTransactions
    .map(({ entry, index }) => {
      const selected = selectedTransactionData?.[index]
      const submissions = entry.formattedSubmissions

      if (selected) {
        const cred = submissions
          .flatMap((s) => (s.isSatisfied ? s.credentials : []))
          .find((c) => c.credential.id === selected.credentialId)
        if (cred) return cred
      }
      // Fallback to first credential of first submission if no selection matches or is provided
      const firstSubmission = submissions[0]
      return firstSubmission?.isSatisfied ? firstSubmission.credentials[0] : undefined
    })
    .filter((c): c is NonNullable<typeof c> => !!c)

  // Deduplicate signing cards based on credential ID
  const uniqueSigningCards = signingCards.filter(
    (c, i, arr) => arr.findIndex((x) => x.credential.id === c.credential.id) === i
  )

  const usedInputDescriptorIds = qesTransactions.flatMap((t) =>
    t.entry.formattedSubmissions.map((s) => s.inputDescriptorId)
  )

  const remainingEntries =
    submission?.entries.filter((entry) => !usedInputDescriptorIds.includes(entry.inputDescriptorId)) ?? []

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

  const signingWithLabel = (qtsp: QtspInfo) =>
    t({
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
            {qesTransactions.length > 0 && (
              <YStack gap="$4">
                <YStack gap="$2">
                  <Heading heading="sub2">
                    <Trans id="signShare.documentHeading" comment="Heading above the document name">
                      Documents
                    </Trans>
                  </Heading>
                  <Paragraph>
                    <Trans id="signShare.documentIntro" comment="Text above the document to be signed">
                      The following documents will be signed.
                    </Trans>
                  </Paragraph>
                </YStack>
                {qesTransactions.map(({ entry }, index) => (
                  <XStack key={index} br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                    <YStack f={1} gap="$2">
                      <Heading heading="sub2" textTransform="none" color="$grey-800">
                        {entry.documentNames.join(', ')}
                      </Heading>
                      <Paragraph>{signingWithLabel(entry.qtsp)}</Paragraph>
                    </YStack>
                    <MiniDocument logoUrl={entry.qtsp.logo?.url} />
                  </XStack>
                ))}
              </YStack>
            )}

            {uniqueSigningCards.length > 0 && (
              <YStack gap="$4">
                <YStack gap="$2">
                  <Heading heading="sub2">
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

                {uniqueSigningCards.map((card) => (
                  <CardWithAttributes
                    key={card.credential.id}
                    id={card.credential.id}
                    name={card.credential.display.name}
                    backgroundImage={card.credential.display.backgroundImage}
                    backgroundColor={card.credential.display.backgroundColor}
                    issuerImage={card.credential.display.issuer.logo}
                    textColor={card.credential.display.textColor}
                    formattedDisclosedAttributes={getDisclosedAttributeNamesForDisplay(card)}
                    disclosedPayload={card.disclosed.attributes}
                    isExpired={
                      card.credential.metadata?.validUntil
                        ? new Date(card.credential.metadata.validUntil) < new Date()
                        : false
                    }
                    isNotYetActive={
                      card.credential.metadata?.validFrom
                        ? new Date(card.credential.metadata.validFrom) > new Date()
                        : false
                    }
                  />
                ))}
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
