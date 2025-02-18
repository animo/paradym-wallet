import { Button, HeroIcons, OnboardingStepItem, Paragraph, ScrollableStack, YStack } from '@package/ui'

interface OnboardingIntroductionStepsProps {
  goToNextStep: () => void
}

export function OnboardingIntroductionSteps({ goToNextStep }: OnboardingIntroductionStepsProps) {
  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <ScrollableStack gap="$2" pb="$4" accessible={true} accessibilityRole="list">
          <OnboardingStepItem
            stepName="step 1"
            title="Secure the wallet"
            description="Choose a 6-digit PIN and set up biometrics to secure the wallet."
            icon={<HeroIcons.Key color="$white" size={20} />}
          />
          <OnboardingStepItem
            stepName="step 2"
            title="Scan your physical ID card"
            description="Use your ID card PIN to retrieve your  identity information."
            icon={<HeroIcons.Identification color="$white" size={20} />}
          />
        </ScrollableStack>
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Paragraph variant="sub" py="$2" textAlign="center">
          You'll need your eID card to setup the wallet
        </Paragraph>
        <Button.Solid scaleOnPress alignSelf="stretch" onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
