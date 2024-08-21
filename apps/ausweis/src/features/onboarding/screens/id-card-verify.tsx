import { Button, IdCard, YStack } from '@package/ui'
import React from 'react'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardFetchProps {
  goToNextStep: () => void
}

export function OnboardingIdCardVerify({ goToNextStep }: OnboardingIdCardFetchProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard icon="biometric" issuerImage={germanIssuerImage} />
      <Button.Solid onPress={goToNextStep}>Unlock with biometrics</Button.Solid>
    </YStack>
  )
}
