import { Button, IdCard, YStack } from '@package/ui'
import React from 'react'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardBiometricsDisabledProps {
  goToNextStep: () => void
}

export function OnboardingIdCardBiometricsDisabled({ goToNextStep }: OnboardingIdCardBiometricsDisabledProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" issuerImage={germanIssuerImage} />
      <Button.Solid onPress={goToNextStep}>Go to settings</Button.Solid>
    </YStack>
  )
}
