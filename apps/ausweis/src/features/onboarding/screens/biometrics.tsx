import { AnimatedFingerPrintCircle, Button, XStack, YStack } from '@package/ui'
import React from 'react'

interface OnboardingBiometricsProps {
  goToNextStep: () => void
}

export function OnboardingBiometrics({ goToNextStep }: OnboardingBiometricsProps) {
  return (
    <YStack fg={1} jc="space-between" gap="$6">
      <YStack justifyContent="center" alignItems="center">
        <XStack ai="center" jc="center" h="$15" border w="100%" p="$4" br="$4" bg="#dbe9fe33">
          <AnimatedFingerPrintCircle />
        </XStack>
      </YStack>
      <Button.Solid alignSelf="stretch" onPress={goToNextStep}>
        Activate Biometrics
      </Button.Solid>
    </YStack>
  )
}
