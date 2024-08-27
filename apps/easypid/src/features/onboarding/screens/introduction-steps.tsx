import { Button, HeroIcons, OnboardingStepItem, Paragraph, YStack } from '@package/ui'
import React from 'react'

interface OnboardingIntroductionStepsProps {
  goToNextStep: () => void
}

export function OnboardingIntroductionSteps({ goToNextStep }: OnboardingIntroductionStepsProps) {
  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="$5">
        <OnboardingStepItem
          stepName="step 1"
          title="Secure the wallet"
          description="Set up a security PIN and biometrics to secure the wallet."
          icon={<HeroIcons.Key color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 2"
          title="Scan your physical ID card"
          description="Use your ID card PIN to retrieve your  identity information."
          icon={<HeroIcons.Identification color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 3"
          title="Claim your identity"
          description="Validate your information and complete the app setup."
          icon={<HeroIcons.Star color="$white" size={20} />}
        />
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Paragraph variant="sub" color="$grey-600" fontWeight="$medium" textAlign="center">
          You'll need your eID card to setup the wallet
        </Paragraph>
        <Button.Solid scaleOnPress alignSelf="stretch" onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
