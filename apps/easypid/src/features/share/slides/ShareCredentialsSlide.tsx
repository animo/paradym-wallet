import {
  GenericTransactionSummaryCard,
  PaymentSummaryCard,
  QesSummaryCard,
} from '@easypid/features/share/components/TransactionSummaryCards'
import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import {
  getAcceptLabel,
  getRemainingEntries,
  getTransactionCards,
  getUniqueTransactionCards,
} from '@easypid/utils/transactionUtils'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type DisplayImage,
  type FormattedSubmission,
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  type QesTransactionDataEntry,
  type Ts12TransactionDataEntry,
} from '@package/agent'
import { CardWithAttributes, DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, MessageBox, Paragraph, ScrollView, YStack } from '@package/ui'
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
  overAskingResponse?: OverAskingResponse
  formattedTransactionData?: FormattedTransactionData
  selectedTransactionData?: {
    credentialId?: string
    additionalPayload?: object
  }[]
}

export const ShareCredentialsSlide = ({
  logo,
  submission,
  onAccept,
  onDecline,
  isAccepting,
  isOffline,
  overAskingResponse,
  formattedTransactionData,
  selectedTransactionData,
}: ShareCredentialsSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const [isProcessing, setIsProcessing] = useState(isAccepting)
  const { t } = useLingui()

  const handleAccept = async () => {
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  const remainingEntries = getRemainingEntries(submission, formattedTransactionData)
  const transactionCards = getTransactionCards(formattedTransactionData, selectedTransactionData)
  const uniqueTransactionCards = getUniqueTransactionCards(transactionCards)
  const acceptLabel = getAcceptLabel(formattedTransactionData, t)

  const fallbackPurpose = t({
    id: 'submission.fallbackPurpose',
    message: 'No information was provided on the purpose of the data request. Be cautious',
    comment: 'Shown when a submission has no stated purpose',
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
                })}
                message={t({
                  id: 'submission.offlineRequestDescription',
                  message:
                    'Information about the verifier could not be shown. Carefully consider if you trust this organization.',
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

            {formattedTransactionData?.map((entry, index) => {
              if (entry.type === 'qes_authorization') {
                return <QesSummaryCard key={index} entry={entry as QesTransactionDataEntry} />
              }

              if (entry.type === 'urn:eudi:sca:payment:1') {
                return (
                  <PaymentSummaryCard
                    key={index}
                    entry={entry as Ts12TransactionDataEntry}
                    index={index}
                    selectedTransactionData={selectedTransactionData}
                  />
                )
              }

              return (
                <GenericTransactionSummaryCard
                  key={index}
                  entry={entry as Ts12TransactionDataEntry}
                  index={index}
                  selectedTransactionData={selectedTransactionData}
                />
              )
            })}

            {uniqueTransactionCards.length > 0 && (
              <YStack gap="$4">
                <YStack gap="$2">
                  <Heading heading="sub2">
                    <Trans id="submission.transactionCardsHeading">Transaction cards</Trans>
                  </Heading>
                  <Paragraph>
                    <Trans id="submission.transactionCardsIntro">
                      The following personal information will be used for the transactions.
                    </Trans>
                  </Paragraph>
                </YStack>

                {uniqueTransactionCards.map((card) => (
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
        {submission.areAllSatisfied ? (
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
              <Trans id="submission.missingCardsWarning">You don't have the required cards</Trans>
            </Paragraph>
            <Button.Solid onPress={handleDecline}>{t(commonMessages.close)}</Button.Solid>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
