import { Button, IdCard, YStack } from '@package/ui'
import React from 'react'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardVerifyProps {
  goToNextStep: () => void
}

export function OnboardingIdCardVerify({ goToNextStep }: OnboardingIdCardVerifyProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" issuerImage={germanIssuerImage} />
      <Button.Solid scaleOnPress onPress={goToNextStep}>
        Unlock with biometrics
      </Button.Solid>
    </YStack>
  )
}
