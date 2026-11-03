import { useImageScaler } from '@package/app'
import { Button, HeroIcons, Spinner, YStack } from '@package/ui'
import { useState } from 'react'
import { SetUpBiometrics } from './assets/SetUpBiometrics'

interface OnboardingBiometricsProps {
  goToNextStep: (enableBiometrics: boolean) => Promise<void>
  actionText: string
  skipText?: string
}

export function OnboardingBiometrics({ goToNextStep, actionText, skipText }: OnboardingBiometricsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { height, onLayout } = useImageScaler({ scaleFactor: 0.6 })

  const onEnableBiometrics = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep(true)
      // It's ok to not handle this
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  const onSkipBiometrics = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep(false)
      // It's ok to not handle this
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  return (
    <YStack grow={1} justify="space-between" gap="8">
      <YStack flex={1} items="center" onLayout={onLayout}>
        <YStack height={height} mt="5">
          <SetUpBiometrics />
        </YStack>
      </YStack>
      <YStack>
        <Button.Solid grow={1} scaleOnPress disabled={isLoading} alignSelf="stretch" onPress={onEnableBiometrics}>
          {isLoading ? <Spinner variant="dark" /> : actionText}
        </Button.Solid>

        {skipText && (
          <Button.Text icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSkipBiometrics}>
            {skipText}
          </Button.Text>
        )}
      </YStack>
    </YStack>
  )
}
