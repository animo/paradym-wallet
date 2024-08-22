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
          title="Setup a pin code for the app"
          description="This code will secure the Ausweis wallet and should be kept to yourself."
          icon={<HeroIcons.Key color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 2"
          title="Scan your physical eID card"
          description="You'll need to validate your eID card using its pin."
          icon={<HeroIcons.Identification color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 3"
          title="Claim your digital identity"
          description="Complete the setup and learn how to use the app."
          icon={<HeroIcons.Star color="$white" size={20} />}
        />
      </YStack>
      <YStack gap="$4" alignItems="center">
        {/* TODO: grey-700 vs secondary */}
        <Paragraph variant="sub" color="$grey-700" textAlign="center">
          You'll need your eID card to setup the wallet
        </Paragraph>
        <Button.Solid alignSelf="stretch" onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
