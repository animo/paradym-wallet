import { useLingui } from '@lingui/react/macro'
import { Button, IdCard, Spinner, YStack } from '@package/ui'
import { useState } from 'react'

export interface OnboardingIdCardVerifyProps {
  goToNextStep: () => Promise<void>
}

export function OnboardingIdCardVerify({ goToNextStep }: OnboardingIdCardVerifyProps) {
  const { t } = useLingui()
  const [isLoading, setIsLoading] = useState(false)

  const onUnlockWithBiometrics = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep().finally(() => {
      setIsLoading(false)
    })
  }

  const unlockLabel = t({
    id: 'onboardingIdCardVerify.unlock',
    message: 'Unlock with biometrics',
    comment: 'Button label for unlocking the ID card using biometrics',
  })

  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" />
      <Button.Solid scaleOnPress onPress={onUnlockWithBiometrics} disabled={isLoading}>
        {isLoading ? <Spinner variant="dark" /> : unlockLabel}
      </Button.Solid>
    </YStack>
  )
}
