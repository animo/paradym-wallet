import type { OverAskingResponse } from '@easypid/use-cases/OverAskingApi'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  type DisplayImage,
  type FormattedSubmission,
  type FormattedSubmissionEntrySatisfied,
  type FormattedTransactionData,
  getDisclosedAttributeNamesForDisplay,
  type QesTransactionDataEntry,
  type Ts12TransactionDataEntry,
} from '@package/agent'
import {
  CardWithAttributes,
  DualResponseButtons,
  MiniDocument,
  useScrollViewPosition,
  useWizard,
} from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, MessageBox, Paragraph, ScrollView, XStack, YStack } from '@package/ui'
import { Image } from 'expo-image'
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
  const { t, i18n } = useLingui()

  const handleAccept = async () => {
    setIsProcessing(true)
    await onAccept?.()
    onNext()
  }

  const handleDecline = () => {
    onDecline?.()
    onCancel()
  }

  const transactionInputDescriptorIds =
    formattedTransactionData?.flatMap((entry) => entry.formattedSubmissions.map((s) => s.inputDescriptorId)) ?? []

  const remainingEntries =
    submission?.entries.filter((entry) => !transactionInputDescriptorIds.includes(entry.inputDescriptorId)) ?? []

  const transactionCards =
    formattedTransactionData
      ?.map((entry, index) => {
        const selected = selectedTransactionData?.[index]
        const submissions = entry.formattedSubmissions

        if (selected) {
          const cred = submissions
            .flatMap((s) => (s.isSatisfied ? s.credentials : []))
            .find((c) => c.credential.id === selected.credentialId)
          if (cred) return cred
        }
        const firstSubmission = submissions[0]
        return firstSubmission?.isSatisfied ? firstSubmission.credentials[0] : undefined
      })
      .filter((c): c is NonNullable<typeof c> => !!c) ?? []

  const uniqueTransactionCards = transactionCards.filter(
    (c, i, arr) => arr.findIndex((x) => x.credential.id === c.credential.id) === i
  )

  const hasQes = formattedTransactionData?.some((t) => t.type === 'qes_authorization')
  const hasPayment = formattedTransactionData?.some((t) => t.type === 'urn:eudi:sca:payment:1')

  let acceptLabel = t({
    id: 'submission.share',
    message: 'Share',
  })

  if (hasQes && hasPayment) {
    acceptLabel = t({ id: 'signPayShare.accept', message: 'Sign, pay & share' })
  } else if (hasQes) {
    acceptLabel = t({ id: 'signShare.accept', message: 'Sign & share' })
  } else if (hasPayment) {
    acceptLabel = t({ id: 'payShare.accept', message: 'Pay & share' })
  }

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
                const qesEntry = entry as QesTransactionDataEntry
                return (
                  <YStack key={index} gap="$4">
                    <YStack gap="$2">
                      <Heading heading="sub2">
                        <Trans id="signShare.documentHeading">Documents</Trans>
                      </Heading>
                      <Paragraph>
                        <Trans id="signShare.documentIntro">The following documents will be signed.</Trans>
                      </Paragraph>
                    </YStack>
                    <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4">
                      <YStack f={1} gap="$2">
                        <Heading heading="sub2" textTransform="none" color="$grey-800">
                          {qesEntry.documentNames.join(', ')}
                        </Heading>
                        <Paragraph>
                          <Trans id="signShare.signingWith">Signing with {qesEntry.qtsp.name}</Trans>
                        </Paragraph>
                      </YStack>
                      <MiniDocument logoUrl={qesEntry.qtsp.logo?.url} />
                    </XStack>
                  </YStack>
                )
              }

              if (entry.type === 'urn:eudi:sca:payment:1') {
                const ts12Entry = entry as Ts12TransactionDataEntry
                // biome-ignore lint/suspicious/noExplicitAny: payload is unknown
                const payload = ts12Entry.payload as any
                const formattedAmount = new Intl.NumberFormat(i18n.locale, {
                  style: 'currency',
                  currency: payload.currency,
                }).format(Number(payload.amount))

                const selected = selectedTransactionData?.[index]
                const submissions = ts12Entry.formattedSubmissions
                let credential: FormattedSubmissionEntrySatisfied['credentials'][0] | undefined
                if (selected) {
                  credential = submissions
                    .flatMap((s) => (s.isSatisfied ? s.credentials : []))
                    .find((c) => c.credential.id === selected.credentialId)
                }
                if (!credential) {
                  const firstSubmission = submissions[0]
                  credential = firstSubmission?.isSatisfied ? firstSubmission.credentials[0] : undefined
                }

                const cardIcon =
                  credential?.credential.display.backgroundImage?.url ?? credential?.credential.display.issuer.logo?.url

                return (
                  <YStack key={index} gap="$4">
                    <YStack gap="$2">
                      <Heading heading="sub2">
                        <Trans id="payment.summaryHeading">Payment</Trans>
                      </Heading>
                      <Paragraph>
                        <Trans id="payment.summaryIntro">The following payment will be authorized.</Trans>
                      </Paragraph>
                    </YStack>
                    <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
                      <YStack f={1} gap="$1">
                        <Heading heading="sub2" textTransform="none" color="$grey-800">
                          {payload.payee?.name ?? <Trans id="payment.unknownPayee">Unknown Payee</Trans>}
                        </Heading>
                        <Paragraph fontWeight="bold">{formattedAmount}</Paragraph>
                      </YStack>
                      {cardIcon ? (
                        <Image
                          source={cardIcon}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                          contentFit="contain"
                        />
                      ) : (
                        <HeroIcons.CreditCard size={24} color="$grey-600" />
                      )}
                    </XStack>
                  </YStack>
                )
              }

              const ts12Entry = entry as Ts12TransactionDataEntry
              const selected = selectedTransactionData?.[index]
              let selectedCredentialId = selected?.credentialId

              if (!selectedCredentialId) {
                const submissions = ts12Entry.formattedSubmissions
                const firstSubmission = submissions[0]
                if (firstSubmission?.isSatisfied) {
                  selectedCredentialId = firstSubmission.credentials[0].credential.id
                }
              }

              const meta = selectedCredentialId
                ? ts12Entry.metaForIds[selectedCredentialId]
                : Object.values(ts12Entry.metaForIds)[0]

              const title =
                meta?.ui_labels.transaction_title?.find((l) => l.lang === i18n.locale)?.value ??
                meta?.ui_labels.transaction_title?.find((l) => l.lang.startsWith(i18n.locale.split('-')[0]))?.value ??
                meta?.ui_labels.transaction_title?.[0]?.value ??
                ts12Entry.type

              return (
                <YStack key={index} gap="$4">
                  <YStack gap="$2">
                    <Heading heading="sub2">
                      <Trans id="transaction.summaryHeading">Transaction</Trans>
                    </Heading>
                    <Paragraph>
                      <Trans id="transaction.summaryIntro">The following transaction will be authorized.</Trans>
                    </Paragraph>
                  </YStack>
                  <XStack br="$6" bg="$grey-50" bw={1} borderColor="$grey-200" gap="$4" p="$4" ai="center">
                    <YStack f={1} gap="$1">
                      <Heading heading="sub2" textTransform="none" color="$grey-800">
                        {title}
                      </Heading>
                    </YStack>
                    <HeroIcons.QueueList size={24} color="$grey-600" />
                  </XStack>
                </YStack>
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
