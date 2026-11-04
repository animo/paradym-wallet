import { Trans, useLingui } from '@lingui/react/macro'
import { DualResponseButtons, useScrollViewPosition, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Circle, Heading, HeroIcons, Image, MiniCardRowItem, Paragraph, ScrollView, XStack, YStack } from '@package/ui'
import type { DisplayImage, FormattedSubmission, FormattedTransactionDataPaymentSingle } from '@paradym/wallet-sdk'
import type React from 'react'
import { useState } from 'react'
import { Linking } from 'react-native'

export type PaymentSlideProps = {
  verifier: {
    name: string
    logo?: DisplayImage
  }
  transaction: FormattedTransactionDataPaymentSingle
  submission?: FormattedSubmission
}

export const PaymentSlide: React.FC<PaymentSlideProps> = ({ transaction, verifier, submission }) => {
  const { onNext, onCancel } = useWizard()
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const { isScrolledByOffset, handleScroll, scrollEventThrottle } = useScrollViewPosition()
  const { t } = useLingui()
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const cardForPayment = submission?.entries.find(
    (entry): entry is typeof entry & { isSatisfied: true } =>
      entry.inputDescriptorId === transaction.cardForTransactionId && entry.isSatisfied
  )?.credentials[0]

  return (
    <YStack grow={1} justify="space-between">
      <YStack
        grow={1}
        px="5"
        mx="-5"
        borderColor={isScrolledByOffset ? 'grey-200' : 'background'}
        onLayout={(event) => {
          if (!scrollViewHeight) setScrollViewHeight(event.nativeEvent.layout.height)
        }}
        borderTopWidth="1"
      >
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{ gap: '8' }}
          px="5"
          mx="-5"
          py="5"
          maxHeight={scrollViewHeight}
        >
          <YStack gap="5">
            <XStack items="center" pt="5" px="8" justify="center" flexDirection="column">
              <Circle size={88} borderWidth="1" borderColor="grey-100" bg="white">
                {verifier.logo?.url ? (
                  <Image
                    circle
                    src={verifier.logo.url}
                    alt={verifier.logo.altText}
                    testID={isImageLoaded ? 'entity-image-loaded' : 'entity-image'}
                    onLoad={() => setIsImageLoaded(true)}
                    width="100%"
                    height="100%"
                    contentFit="contain"
                  />
                ) : (
                  <HeroIcons.BuildingOffice color="grey-800" size={36} />
                )}
              </Circle>
              <Paragraph variant="sub" text="center">
                <Trans
                  id="payment.description"
                  comment="Explanation that the user is about to pay an amount to the payee"
                >
                  {verifier.name} wants you to authorize a payment.
                </Trans>
              </Paragraph>
            </XStack>
            <YStack gap="2">
              <Heading heading="sub2">{t(commonMessages.paymentHeading)}</Heading>
              <Paragraph variant="annotation">
                <Trans id="payShare.documentIntro" comment="Text above the payment to be paid">
                  The following payment will be authorized
                </Trans>
              </Paragraph>
            </YStack>
            <XStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="5" p="5">
              <YStack flex={1} gap="2" items="center">
                <Heading textTransform="none" color="grey-800">
                  {transaction.amount}
                </Heading>
                <Paragraph variant="sub" size="2">
                  {/* TODO: fetch  */}
                  <Trans>Paying with iDeal | Wero</Trans>
                </Paragraph>
              </YStack>
            </XStack>
            <YStack gap="2">
              <Heading heading="sub2">
                <Trans id="payShare.sellerHeading" comment="Heading above the seller section">
                  Seller
                </Trans>
              </Heading>
            </YStack>
            <XStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="5" p="5">
              <YStack flex={1} gap="2">
                <Heading heading="h3" textTransform="none" color="grey-800">
                  {transaction.payee.name}
                </Heading>
                <Paragraph
                  variant="sub"
                  size="2"
                  onPress={() => Linking.openURL(transaction.payee.website)}
                  justify="center"
                >
                  <Trans>
                    Website <HeroIcons.Link size={12} color="grey-700" />
                  </Trans>
                </Paragraph>
              </YStack>
              <Circle size={60} borderWidth="1" borderColor="grey-100" bg="white">
                <Image src={transaction.payee.logo} height="100%" width="100%" contentFit="contain" />
              </Circle>
            </XStack>
            {cardForPayment && (
              <YStack mb="5">
                <YStack gap="2">
                  <Heading heading="sub2">
                    <Trans id="payShare.cardHeading" comment="Heading above the card to be used for authorization">
                      Payment card
                    </Trans>
                  </Heading>
                  <Paragraph variant="annotation">
                    <Trans id="payShare.cardUse" comment="Text above card to be used for payment authorization">
                      The following card will be used to authorize the payment.
                    </Trans>
                  </Paragraph>
                </YStack>
                <MiniCardRowItem
                  name={cardForPayment.credential.display.name ?? t(commonMessages.unknown)}
                  backgroundImageUri={cardForPayment.credential.display.backgroundImage?.url}
                  backgroundColor={cardForPayment.credential.display.backgroundColor ?? 'white'}
                  issuerImageUri={cardForPayment.credential.display.issuer.logo?.url}
                  subtitle={cardForPayment.credential.display.issuer.name ?? t(commonMessages.unknown)}
                />
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
      <YStack borderTopWidth="1" borderColor="grey-200" pt="3" mx="-5" px="5" bg="background">
        <DualResponseButtons
          align="horizontal"
          acceptText={t(commonMessages.continue)}
          declineText={t(commonMessages.stop)}
          onAccept={() => onNext()}
          onDecline={() => onCancel()}
          isLoading={false}
        />
      </YStack>
    </YStack>
  )
}
