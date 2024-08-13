import { Button, HeroIcons, OnboardingStepItem, Paragraph, YStack } from '@package/ui'
import React from 'react'

interface OnboardingIntroductionStepsProps {
  goToNextStep: () => void
}

export function OnboardingIntroductionSteps({ goToNextStep }: OnboardingIntroductionStepsProps) {
  return (
    <>
      <YStack flex-1 gap="$6">
        <OnboardingStepItem
          stepName="step 1"
          title="Setup a pin code for the app"
          description="This code will secure the Ausweis wallet and should be kept to yourself."
          icon={<HeroIcons.Key color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 2"
          title="Scan your physical passport"
          description="You'll need to validate your passport using it's pin."
          icon={<HeroIcons.Identification color="$white" size={20} />}
        />
        <OnboardingStepItem
          stepName="step 3"
          title="Claim your digital identity"
          description="Complete the setup and learn how to use the app."
          icon={<HeroIcons.Star color="$white" size={20} />}
        />
      </YStack>
      <YStack gap="$2" alignItems="center">
        {/* TODO: grey-700 vs secondary */}
        <Paragraph variant="sub" color="$grey-700" textAlign="center">
          You'll need your passport to setup the wallet
        </Paragraph>
        <Button.Solid alignSelf="stretch" onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </>
  )
}
