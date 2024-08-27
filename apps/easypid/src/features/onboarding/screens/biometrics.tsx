import { Button, HeroIcons, IllustrationContainer, Spinner, YStack } from '@package/ui'
import type React from 'react'
import { useState } from 'react'

interface OnboardingBiometricsProps {
  goToNextStep: () => Promise<void>
  actionText: string
}

export function OnboardingBiometrics({ goToNextStep, actionText }: OnboardingBiometricsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onEnableBiometrics = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep()
      // It's ok to not handle this
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  return (
    <YStack fg={1} jc="space-between" gap="$6">
      <IllustrationContainer>
        <HeroIcons.FingerPrint color="$grey-100" size={72} />
      </IllustrationContainer>
      <Button.Solid fg={1} scaleOnPress disabled={isLoading} alignSelf="stretch" onPress={onEnableBiometrics}>
        {isLoading ? <Spinner variant="dark" /> : actionText}
      </Button.Solid>
    </YStack>
  )
}
