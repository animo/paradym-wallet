import { Button, IdCard, YStack } from '@package/ui'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'
import pidBackgroundImage from '../../../../assets/pid-background.png'

export interface OnboardingIdCardBiometricsDisabledProps {
  goToNextStep: () => void
}

export function OnboardingIdCardBiometricsDisabled({ goToNextStep }: OnboardingIdCardBiometricsDisabledProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" backgroundImage={pidBackgroundImage} issuerImage={germanIssuerImage} />
      <Button.Solid scaleOnPress onPress={goToNextStep}>
        Go to settings
      </Button.Solid>
    </YStack>
  )
}
