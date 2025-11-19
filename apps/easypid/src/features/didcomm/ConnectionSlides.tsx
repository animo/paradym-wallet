import { Trans, useLingui } from '@lingui/react/macro'
import { SlideWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  Button,
  Circle,
  Heading,
  HeroIcons,
  Paragraph,
  Spacer,
  Stack,
  useSpringify,
  YStack,
} from '@package/ui'
import { ZoomIn } from 'react-native-reanimated'
import { getFlowConfirmationText } from './utils'

type ConnectionSlidesProps = {
  name: string
  onCancel: () => void
  onComplete: () => void
}

export function ConnectionSlides({ name, onCancel, onComplete }: ConnectionSlidesProps) {
  const { t } = useLingui()

  return (
    <SlideWizard
      resumeFrom={66}
      steps={[
        {
          step: 'success',
          progress: 100,
          backIsCancel: true,
          screen: <ConnectionSuccessSlide key="verify-issuer" name={name} onComplete={onComplete} />,
        },
      ]}
      onCancel={onCancel}
      confirmation={getFlowConfirmationText(t, 'connect')}
    />
  )
}

type ConnectionSuccessSlideProps = {
  onComplete: () => void
  name: string
}

const ConnectionSuccessSlide = ({ name, onComplete }: ConnectionSuccessSlideProps) => {
  const { t } = useLingui()

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$6" fg={1} ai="center" jc="center">
        <AnimatedStack entering={useSpringify(ZoomIn)} h="$8" jc="center" ai="center" pos="relative">
          <Circle pos="absolute" size={96} bg="$positive-500" opacity={0.1} />
          <Circle pos="absolute" size={72} bg="$positive-500" opacity={0.2} />
          <Circle size="$5" bg="$positive-500">
            <HeroIcons.ShieldCheckFilled strokeWidth={2} size={30} color="$white" />
          </Circle>
        </AnimatedStack>
        <YStack gap="$4" ai="center">
          <Heading>
            <Trans
              id="connection.successTitle"
              comment="Heading shown when a secure connection to an issuer was successfully created"
            >
              Connection established
            </Trans>
          </Heading>
          <Paragraph ta="center">
            <Trans
              id="connection.successParagraph"
              comment="Explains that the user can now receive notifications from the connected issuer"
            >
              You can now receive notifications from {'\n'}
              <Paragraph fontWeight="$semiBold">{name}</Paragraph>
            </Trans>
          </Paragraph>
        </YStack>
        <Spacer />
      </YStack>
      <Stack borderTopWidth="$0.5" borderColor="$grey-200" py="$4" mx="$-4" px="$4">
        <Button.Solid scaleOnPress onPress={onComplete}>
          {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="$white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
