import { AnimatedStack, Button, Heading, HeroIcons, Paragraph, Stack, YStack, useSpringify } from '@package/ui'
import { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated'
import { commonMessages } from '@package/translations'
import { Trans, useLingui } from '@lingui/react/macro'

interface PresentationSuccessSlideProps {
  onComplete: () => void
  verifierName?: string
  showReturnToApp?: boolean
}

export const PresentationSuccessSlide = ({
  verifierName,
  onComplete,
  showReturnToApp,
}: PresentationSuccessSlideProps) => {
  const { t } = useLingui()
  const buttonLabel = t(commonMessages.goToWallet)

  return (
    <YStack fg={1} jc="space-between">
      <YStack fg={1} mt="$10" gap="$4" key="12345">
        <YStack
          position="relative"
          mx="$-4"
          px="$4"
          ai="center"
          bbw="$0.5"
          borderBottomColor="$grey-200"
          overflow="hidden"
        >
          <AnimatedStack entering={useSpringify(FadeInDown).delay(600)} w="90%" h="$14" bg="$primary-200" br="$6" />
          <AnimatedStack
            entering={useSpringify(FadeInDown).delay(450)}
            top="$4"
            position="absolute"
            w="95%"
            h="$12"
            bg="$primary-300"
            br="$6"
          />
          <AnimatedStack
            entering={useSpringify(FadeIn).delay(150)}
            flexDirection="row"
            position="absolute"
            top="$8"
            jc="space-between"
            p="$4"
            w="100%"
            h="$14"
            br="$6"
            borderBottomEndRadius={0}
            borderBottomLeftRadius={0}
            bg="$primary-400"
          >
            <Stack w="40%" bg="$primary-300" h="$2" br="$6" />
            <Stack h="$4.5" w="$4.5" bg="$primary-300" br="$12" />
          </AnimatedStack>
          <AnimatedStack
            entering={ZoomIn.springify().delay(150)}
            position="absolute"
            jc="center"
            ai="center"
            top="10%"
            h="$5"
            w="$5"
            bg="$grey-900"
            br="$12"
          >
            <HeroIcons.Interaction color="white" size={36} strokeWidth={2} />
          </AnimatedStack>
        </YStack>

        <YStack gap="$4" p="$4" ai="center">
          <Heading>{t(commonMessages.success)}</Heading>

          <Paragraph ta="center">
            {verifierName ? (
              <Trans
                id="presentationSuccess.messageWithVerifier"
                comment="Shown after credentials are shared with a specific verifier"
              >
                Your information has been shared with <Paragraph fontWeight="$semiBold">{verifierName}</Paragraph>.
              </Trans>
            ) : (
              <Trans id="presentationSuccess.message" comment="Shown after credentials are shared (no verifier name)">
                Your information has been shared.
              </Trans>
            )}
          </Paragraph>
        </YStack>
      </YStack>

      <Stack gap="$3" borderTopWidth="$0.5" borderColor="$grey-200" p="$4" py="$2" mx="$-4">
        {showReturnToApp && (
          <Paragraph variant="annotation" ta="center">
            <Trans id="presentationSuccess.returnHint" comment="Instruction shown after presentation is completed">
              You can now return to the previous app.
            </Trans>
          </Paragraph>
        )}
        <Button.Solid scaleOnPress onPress={onComplete}>
          {buttonLabel} <HeroIcons.ArrowRight size={20} color="$white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
