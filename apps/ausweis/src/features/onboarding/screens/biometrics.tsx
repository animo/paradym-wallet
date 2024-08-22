import { Button, HeroIcons, IllustrationContainer, YStack } from '@package/ui'
import type React from 'react'

interface OnboardingBiometricsProps {
  goToNextStep: () => void
}

export function OnboardingBiometrics({ goToNextStep }: OnboardingBiometricsProps) {
  return (
    <YStack fg={1} jc="space-between" gap="$6">
      <IllustrationContainer>
        <HeroIcons.FingerPrint color="$grey-100" size={72} />
      </IllustrationContainer>
      <Button.Solid alignSelf="stretch" onPress={goToNextStep}>
        Activate Biometrics
      </Button.Solid>
    </YStack>
  )
}
