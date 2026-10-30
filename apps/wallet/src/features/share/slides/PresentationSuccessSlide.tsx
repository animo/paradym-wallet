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
    <YStack mx="-4" px="4" ai="center" bbw="0-5" borderBottomColor="grey-200">
      <YStack position="relative" w="100%" maxWidth={300} ai="center" overflow="hidden">
        <AnimatedStack entering={useSpringify(FadeInDown).delay(600)} w="90%" h={128} bg="primary-200" br="6" />
        <AnimatedStack
          entering={useSpringify(FadeInDown).delay(450)}
          top={12}
          position="absolute"
          w="95%"
          h={100}
          bg="primary-300"
          br="6"
        />
        <AnimatedStack
          entering={useSpringify(FadeIn).delay(150)}
          flexDirection="row"
          position="absolute"
          top={58}
          jc="space-between"
          p="3"
          w="100%"
          h={128}
          br="6"
          borderBottomEndRadius={0}
          borderBottomLeftRadius={0}
          bg="primary-400"
        >
          <Stack w="40%" bg="primary-300" h="1-5" br="6" />
          <Stack h="3" w="3" bg="primary-300" br="12" />
        </AnimatedStack>
        <AnimatedStack
          entering={ZoomIn.springify().delay(150)}
          position="absolute"
          jc="center"
          ai="center"
          top={20}
          h="4"
          w="4"
          bg="grey-900"
          br="12"
        >
          <HeroIcons.Interaction color="white" size={26} strokeWidth={2} />
        </AnimatedStack>
      </YStack>
    </YStack>
  )

  const content = (
    <YStack fg={1} jc="space-between">
      <YStack fg={1} mt="6" gap="4" key="12345" jc={ownsWideLayout ? 'center' : undefined}>
        {!ownsWideLayout && illustration}
        <YStack gap="4" p="4" ai="center">
          {/* The same mark as a stored card gets, where the illustration doesn't show */}
          {ownsWideLayout && <HeroIcons.ShieldCheckFilled color="primary-500" size={48} />}
          <Heading>{t(commonMessages.success)}</Heading>

          <Paragraph ta="center">
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

      <Stack gap="3" borderTopWidth="0-5" borderColor="grey-200" paddingRight="4" paddingLeft="4" py="2" mx="-4">
        {showReturnToApp && (
          <Paragraph variant="annotation" ta="center">
            <Trans id="presentationSuccess.returnHint" comment="Instruction shown after presentation is completed">
              You can now return to the previous app.
            </Trans>
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
            <YStack pt="4" gap="6">
              {payment && (
                <YStack br="6" bg="grey-50" bw={1} borderColor="grey-200" gap="1" p="4" ai="center">
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
