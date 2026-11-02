import { Trans, useLingui } from '@lingui/react/macro'
import { SlidePane, useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { AnimatedStack, Button, Heading, HeroIcons, Paragraph, Stack, TwoPane, useSpringify, YStack } from '@package/ui'
import type { FormattedSubmission } from '@paradym/wallet-sdk'
import { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated'
import { SharedCardsList } from '../components/RequestedAttributesSection'

interface PresentationSuccessSlideProps {
  onComplete: () => void
  verifierName?: string
  showReturnToApp?: boolean
  // Wide windows list these shared cards next to the success message, when the step owns its wide layout
  submission?: FormattedSubmission
  // Wide windows show what was paid above the shared cards
  payment?: { amount: string; payee: string }
}

export const PresentationSuccessSlide = ({
  verifierName,
  onComplete,
  showReturnToApp,
  submission,
  payment,
}: PresentationSuccessSlideProps) => {
  const { t } = useLingui()
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
              <Trans id="presentationSuccess.message" comment="Shown after credentials are shared (no verifier name)">
                Your information has been shared.
              </Trans>
            )}
          </Paragraph>
        </YStack>
      </YStack>

      <Stack gap="3" borderTopWidth="1" borderColor="grey-200" paddingRight="5" paddingLeft="5" py="2" mx="-5">
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

  if (ownsWideLayout && submission) {
    // Wide windows list the shared cards next to the success message, instead of the illustration
    return (
      <TwoPane
        start={
          <SlidePane>
            <YStack pt="5" gap="8">
              {payment && (
                <YStack rounded="6" bg="grey-50" borderWidth={1} borderColor="grey-200" gap="0-5" p="5" items="center">
                  <Heading textTransform="none" color="grey-800">
                    {payment.amount}
                  </Heading>
                  <Paragraph variant="sub">
                    <Trans id="presentationSuccess.paidTo" comment="Shown below the amount of a completed payment">
                      Paid to {payment.payee}
                    </Trans>
                  </Paragraph>
                </YStack>
              )}
              <SharedCardsList submission={submission} />
            </YStack>
          </SlidePane>
        }
        end={<SlidePane>{content}</SlidePane>}
      />
    )
  }

  return content
}
