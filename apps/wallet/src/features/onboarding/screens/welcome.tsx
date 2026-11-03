import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Blob, Button, FlexPage, Heading, Image, Paragraph, Stack, XStack, YStack } from '@package/ui'
import ExpoConstants from 'expo-constants'

export interface OnboardingWelcomeProps {
  goToNextStep: () => void
}

export default function OnboardingWelcome({ goToNextStep }: OnboardingWelcomeProps) {
  const { t } = useLingui()

  const introText = t({
    id: 'onboardingWelcome.description',
    message: 'This is your digital wallet. With it, you can store and share information about yourself.',
    comment: 'Intro paragraph on the welcome screen',
  })

  const getStartedLabel = t(commonMessages.getStarted)

  return (
    <YStack grow={1} position="relative">
      <YStack position="absolute" h="50%" w="100%">
        <Blob />
        <YStack
          transform={[{ translateX: -48 }]} // Half of the image width (96/2)
          position="absolute"
          top="40%"
          left="50%"
          items="center"
          justify="center"
        >
          <Stack
            rounded="7"
            overflow="hidden"
            bg="primary-500"
            shadowOffset={{ width: 5, height: 5 }}
            shadowColor="grey-400"
            shadowOpacity={0.5}
            shadowRadius={24}
          >
            <Image height={96} width={96} src="icon" />
          </Stack>
        </YStack>
      </YStack>
      <FlexPage grow={1} justify="space-between" backgroundColor="transparent">
        <Stack h="40%" />
        <YStack gap="5" items="center">
          <Heading fontSize={32} lineHeight="40px">
            {ExpoConstants.expoConfig?.name}
          </Heading>
          <Paragraph px="2" text="center">
            {introText}
          </Paragraph>
        </YStack>
        <XStack gap="2">
          <Button.Solid flexGrow={1} onPress={goToNextStep}>
            {getStartedLabel}
          </Button.Solid>
        </XStack>
      </FlexPage>
    </YStack>
  )
}
