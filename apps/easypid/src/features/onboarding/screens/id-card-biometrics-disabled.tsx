import { Button, IdCard, YStack } from '@package/ui'

export interface OnboardingIdCardBiometricsDisabledProps {
  goToNextStep: () => void
}

export function OnboardingIdCardBiometricsDisabled({ goToNextStep }: OnboardingIdCardBiometricsDisabledProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" />
      <Button.Solid scaleOnPress onPress={goToNextStep}>
        Go to settings
      </Button.Solid>
    </YStack>
  )
}
