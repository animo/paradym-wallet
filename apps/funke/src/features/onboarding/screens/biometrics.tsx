import { AnimatedFingerprintIcon, Button, YStack } from '@package/ui'
import React from 'react'

interface OnboardingBiometricsProps {
  goToNextStep: () => void
}

export function OnboardingBiometrics({ goToNextStep }: OnboardingBiometricsProps) {
  return (
    <YStack gap="$6" flex-1>
      <YStack flex-1 justifyContent="center" alignItems="center">
        <AnimatedFingerprintIcon />
      </YStack>
      <Button.Solid alignSelf="stretch" onPress={goToNextStep}>
        Activate Biometrics
      </Button.Solid>
    </YStack>
  )
}
