import { Trans, useLingui } from '@lingui/react/macro'
import { type PaymentKind, SlidePane, useWizard } from '@package/app'
import { credentialSvgArtwork } from '@package/app/components/CredentialSvg'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Button,
  Heading,
  HeroIcons,
  Paragraph,
  Stack,
  TwoPane,
  useSpringify,
  XStack,
  YStack,
} from '@package/ui'
import { formatAmount } from '@package/utils'
import type { CredentialForDisplay, FormattedSubmission } from '@paradym/wallet-sdk'
import { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated'
import { CardRow } from '../components/CardRow'
import { PayingAccount } from '../components/PayingAccount'
import { SharedCardsList } from '../components/RequestedAttributesSection'

interface PresentationSuccessSlideProps {
  onComplete: () => void
  verifierName?: string
  showReturnToApp?: boolean
  // Wide windows list these shared cards next to the success message, when the step owns its wide layout
  submission?: FormattedSubmission
  /**
   * A payment or PaSO transaction the user authorised: the bank that processes it, the card it is paid with, and
   * the amount and payee when it is or embeds a payment. Wide windows show the amount above the other shared cards.
   * `canFollowStatus` when the wallet can poll its status, so the user can follow it in Activity.
   */
  payment?: {
    kind: PaymentKind
    amount?: string
    payee?: string
    issuer?: string
    card?: CredentialForDisplay
    canFollowStatus?: boolean
  }
}

export const PresentationSuccessSlide = ({
  verifierName,
  onComplete,
  showReturnToApp,
  submission,
  payment,
}: PresentationSuccessSlideProps) => {
  const { t, i18n } = useLingui()
  const buttonLabel = t(commonMessages.goToWallet)
  const { ownsWideLayout } = useWizard()

  const illustration = (
    <YStack mx="-5" px="5" items="center" borderBottomWidth="1" borderBottomColor="grey-200">
      <YStack position="relative" w="100%" maxWidth={300} items="center" overflow="hidden">
        <AnimatedStack entering={useSpringify(FadeInDown).delay(600)} w="90%" h={128} bg="primary-200" rounded="6" />
        <AnimatedStack
          entering={useSpringify(FadeInDown).delay(450)}
          top={12}
          position="absolute"
          w="95%"
          h={100}
          bg="primary-300"
          rounded="6"
        />
        <AnimatedStack
          entering={useSpringify(FadeIn).delay(150)}
          flexDirection="row"
          position="absolute"
          top={58}
          justify="space-between"
          p="3"
          w="100%"
          h={128}
          rounded="6"
          borderBottomEndRadius={0}
          borderBottomLeftRadius={0}
          bg="primary-400"
        >
          <Stack w="40%" bg="primary-300" h="6" rounded="6" />
          <Stack h="9" w="9" bg="primary-300" rounded="12" />
        </AnimatedStack>
        <AnimatedStack
          entering={ZoomIn.springify().delay(150)}
          position="absolute"
          justify="center"
          items="center"
          top={20}
          h="11"
          w="11"
          bg="grey-900"
          rounded="12"
        >
          <HeroIcons.Interaction color="white" size={26} strokeWidth={2} />
        </AnimatedStack>
      </YStack>
    </YStack>
  )

  const content = (
    <YStack grow={1} justify="space-between">
      <YStack grow={1} mt="8" gap="5" key="12345" justify={ownsWideLayout ? 'center' : undefined}>
        {!ownsWideLayout && illustration}
        <YStack gap="5" p="5" items="center">
          {/* The same mark as a stored card gets, where the illustration doesn't show */}
          {ownsWideLayout && <HeroIcons.ShieldCheckFilled color="primary-500" size={48} />}
          {payment ? (
            <>
              <Heading>
                {payment.kind === 'mandate'
                  ? t({
                      id: 'presentationSuccess.mandateAuthorised',
                      message: 'Mandate authorised',
                      comment: 'Title after the user authorised a mandate and its first payment',
                    })
                  : payment.kind === 'transaction'
                    ? t({
                        id: 'presentationSuccess.transactionAuthorised',
                        message: 'Transaction authorised',
                        comment:
                          'Title after the user authorised a bank transaction that is not a plain payment, such as a transfer or standing order',
                      })
                    : t({
                        id: 'presentationSuccess.paymentAuthorised',
                        message: 'Payment authorised',
                        comment: 'Title after the user authorised a payment, which the bank still has to carry out',
                      })}
              </Heading>
              {/* Authorised, not paid: the bank still carries the payment out. */}
              <Paragraph text="center">
                {!payment.canFollowStatus
                  ? payment.issuer
                    ? t({
                        id: 'presentationSuccess.processingByIssuer',
                        message: `${payment.issuer} is now processing it.`,
                        comment:
                          'Shown after a payment was authorised whose status the wallet cannot follow, naming the bank that processes it',
                      })
                    : t({
                        id: 'presentationSuccess.processing',
                        message: 'Your bank is now processing it.',
                        comment: 'Shown after a payment was authorised whose status the wallet cannot follow',
                      })
                  : payment.issuer
                    ? t({
                        id: 'presentationSuccess.paymentProcessingByIssuer',
                        message: `${payment.issuer} is now processing it. You can follow it in Activity.`,
                        comment: 'Shown after a payment was authorised, naming the bank that processes it',
                      })
                    : t({
                        id: 'presentationSuccess.paymentProcessing',
                        message: 'Your bank is now processing it. You can follow it in Activity.',
                        comment: 'Shown after a payment was authorised',
                      })}
              </Paragraph>
              {(payment.payee || payment.amount || payment.card) && (
                <YStack w="100%" rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" p="4" gap="3">
                  {payment.payee && (
                    <PaymentSummaryRow
                      label={t({ id: 'presentationSuccess.paymentTo', message: 'To', comment: 'Payee of a payment' })}
                      value={payment.payee}
                    />
                  )}
                  {payment.amount && (
                    <PaymentSummaryRow
                      label={t({
                        id: 'presentationSuccess.paymentAmount',
                        message: 'Amount',
                        comment: 'Amount of a payment',
                      })}
                      value={formatAmount(payment.amount, i18n.locale)}
                    />
                  )}
                  {payment.card && (
                    <PayingAccount>
                      <CardRow
                        card={{ credential: payment.card }}
                        artwork={credentialSvgArtwork(payment.card.display.svg)}
                        wrap
                      />
                    </PayingAccount>
                  )}
                </YStack>
              )}
            </>
          ) : (
            <>
              <Heading>{t(commonMessages.success)}</Heading>

              <Paragraph text="center">
                {verifierName ? (
                  <Trans
                    id="presentationSuccess.messageWithVerifier"
                    comment="Shown after credentials are shared with a specific verifier"
                  >
                    Your information has been shared with <Paragraph fontWeight="semiBold">{verifierName}</Paragraph>.
                  </Trans>
                ) : (
                  <Trans
                    id="presentationSuccess.message"
                    comment="Shown after credentials are shared (no verifier name)"
                  >
                    Your information has been shared.
                  </Trans>
                )}
              </Paragraph>
            </>
          )}
        </YStack>
      </YStack>

      <Stack gap="3" borderTopWidth="1" borderColor="grey-200" paddingRight="5" paddingLeft="5" pt="2" mx="-5">
        {showReturnToApp && (
          <Paragraph variant="annotation" text="center">
            {t(commonMessages.returnToPreviousApp)}
          </Paragraph>
        )}
        <Button.Solid scaleOnPress onPress={onComplete}>
          {buttonLabel} <HeroIcons.ArrowRight size={20} color="white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )

  // The card a payment is paid with is in the summary, not among the shared cards
  const sharedEntries = submission?.entries.filter(
    (entry) => !entry.isSatisfied || entry.credentials[0].credential.id !== payment?.card?.id
  )

  if (ownsWideLayout && submission) {
    // Wide windows list the shared cards next to the success message, instead of the illustration
    return (
      <TwoPane
        start={
          <SlidePane>
            <YStack pt="5" gap="8">
              {payment?.amount && (
                <YStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="0-5" p="5" items="center">
                  <Heading textTransform="none" color="grey-800">
                    {formatAmount(payment.amount, i18n.locale)}
                  </Heading>
                  <Paragraph variant="sub">
                    <Trans id="presentationSuccess.paidTo" comment="Shown below the amount of a completed payment">
                      Paid to {payment.payee}
                    </Trans>
                  </Paragraph>
                </YStack>
              )}
              {sharedEntries?.some((entry) => entry.isSatisfied) && (
                <SharedCardsList submission={{ ...submission, entries: sharedEntries }} />
              )}
            </YStack>
          </SlidePane>
        }
        end={<SlidePane>{content}</SlidePane>}
      />
    )
  }

  return content
}

function PaymentSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justify="space-between" gap="4" items="flex-start">
      <Paragraph variant="sub">{label}</Paragraph>
      <Paragraph flex={1} text="right" color="grey-900" fontWeight="semiBold">
        {value}
      </Paragraph>
    </XStack>
  )
}
