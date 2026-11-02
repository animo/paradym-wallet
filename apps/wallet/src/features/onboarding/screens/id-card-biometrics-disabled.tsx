import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, IdCard, YStack } from '@package/ui'

export interface OnboardingIdCardBiometricsDisabledProps {
  goToNextStep: () => void
}

export function OnboardingIdCardBiometricsDisabled({ goToNextStep }: OnboardingIdCardBiometricsDisabledProps) {
  const { t } = useLingui()

  return (
    <YStack justify="space-between" grow={1}>
      <IdCard hideUserName icon="biometric" />
      <Button.Solid scaleOnPress onPress={goToNextStep}>
        {t(commonMessages.goToSettings)}
      </Button.Solid>
    </YStack>
  )
}
