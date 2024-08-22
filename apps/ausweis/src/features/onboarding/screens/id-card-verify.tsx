import { Button, IdCard, YStack } from '@package/ui'
import React from 'react'

import germanIssuerImage from '../../../../assets/german-issuer-image.png'

export interface OnboardingIdCardFetchProps {
  goToNextStep: () => void
}

// We could also skip this screen and request biometrics in the flow like now, and only go to this screen if that fails.

export function OnboardingIdCardVerify({ goToNextStep }: OnboardingIdCardFetchProps) {
  return (
    <YStack jc="space-between" fg={1}>
      <IdCard hideUserName icon="biometric" issuerImage={germanIssuerImage} />
      <Button.Solid onPress={goToNextStep}>Unlock with biometrics</Button.Solid>
    </YStack>
  )
}
