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
    <YStack grow={1} justify="space-between">
      <YStack gap="8" grow={1} items="center" justify="center">
        <AnimatedStack entering={useSpringify(ZoomIn)} h={84} justify="center" items="center" position="relative">
          <Circle position="absolute" size={96} bg="positive-500" opacity={0.1} />
          <Circle position="absolute" size={72} bg="positive-500" opacity={0.2} />
          <Circle size={52} bg="positive-500">
            <HeroIcons.ShieldCheckFilled strokeWidth={2} size={30} color="white" />
          </Circle>
        </AnimatedStack>
        <YStack gap="5" items="center">
          <Heading>
            <Trans
              id="connection.successTitle"
              comment="Heading shown when a secure connection to an issuer was successfully created"
            >
              Connection established
            </Trans>
          </Heading>
          <Paragraph text="center">
            <Trans
              id="connection.successParagraph"
              comment="Explains that the user can now receive notifications from the connected issuer"
            >
              You can now receive notifications from {'\n'}
              <Paragraph fontWeight="semiBold">{name}</Paragraph>
            </Trans>
          </Paragraph>
        </YStack>
        <Spacer size="5" />
      </YStack>
      <Stack borderTopWidth="1" borderColor="grey-200" py="3" mx="-5" px="5">
        <Button.Solid scaleOnPress onPress={onComplete}>
          {t(commonMessages.goToWallet)} <HeroIcons.ArrowRight size={20} color="white" />
        </Button.Solid>
      </Stack>
    </YStack>
  )
}
