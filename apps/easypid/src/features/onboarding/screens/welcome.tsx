import { useLingui } from '@lingui/react/macro'
import { Blob, Button, FlexPage, Heading, Image, Paragraph, Stack, XStack, YStack } from '@package/ui'

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

  const getStartedLabel = t({
    id: 'onboardingWelcome.getStarted',
    message: 'Get Started',
    comment: 'Button label to begin onboarding from the welcome screen',
  })

  return (
    <YStack fg={1} pos="relative">
      <YStack pos="absolute" h="50%" w="100%">
        <Blob
          parts={{
            // Left cluster
            leftOuter: { color: '#E7C2F9' }, // light purple
            leftInner: { color: '#AC79C5', opacity: 0.95 },

            // Right cluster
            rightOuter: { color: '#FDDFD1' }, // soft orange base
            rightInner: { color: '#F6724B', opacity: 0.9 },

            // Top sweeps (energy layer)
            topRightSweep: { color: '#F14C2E' },
            topLeftSweep: { color: '#FCC0A3' },

            // Core anchors (depth)
            topRightCore: { color: '#451B76' },
            topLeftCore: { color: '#2D0F65' },
          }}
        />
        <YStack
          transform={[{ translateX: -48 }]} // Half of the image width (96/2)
          pos="absolute"
          top="40%"
          left="50%"
          ai="center"
          jc="center"
        >
          <Stack
            br="$7"
            ov="hidden"
            bg="$primary-500"
            shadowOffset={{ width: 5, height: 5 }}
            shadowColor="$grey-400"
            shadowOpacity={0.5}
            shadowRadius={24}
          >
            <Image height={96} width={96} src="icon" />
          </Stack>
        </YStack>
      </YStack>
      <FlexPage fg={1} jc="space-between" backgroundColor="$transparent">
        <Stack h="40%" />
        <YStack gap="$4" ai="center">
          <Heading fontSize={32}>DIDx Wallet</Heading>
          <Paragraph px="$2" ta="center">
            {introText}
          </Paragraph>
        </YStack>
        <XStack gap="$2">
          <Button.Solid flexGrow={1} onPress={goToNextStep}>
            {getStartedLabel}
          </Button.Solid>
        </XStack>
      </FlexPage>
    </YStack>
  )
}
