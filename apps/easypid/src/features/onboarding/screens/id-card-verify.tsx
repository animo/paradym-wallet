import { Button, IdCard, Spinner, YStack } from '@package/ui'
import { useState } from 'react'

export interface OnboardingIdCardVerifyProps {
  goToNextStep: () => Promise<void>
}

export function OnboardingIdCardVerify({ goToNextStep }: OnboardingIdCardVerifyProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onUnlockWithBiometrics = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep().finally(() => {
      setIsLoading(false)
    })
  }
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" />
      <Button.Solid scaleOnPress onPress={onUnlockWithBiometrics} disabled={isLoading}>
        {isLoading ? <Spinner variant="dark" /> : 'Unlock with biometrics'}
      </Button.Solid>
    </YStack>
  )
}
