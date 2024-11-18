import { Button, HeroIcons, IllustrationContainer, YStack } from '@package/ui'
import React from 'react'
import { Linking } from 'react-native'

interface OnboardingDataProtectionProps {
  goToNextStep: () => void
}

export function OnboardingDataProtection({ goToNextStep }: OnboardingDataProtectionProps) {
  const onPressPrivacy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <IllustrationContainer variant="feature">
          <HeroIcons.InformationCircle color="$white" size={48} />
        </IllustrationContainer>
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Button.Text onPress={onPressPrivacy} py="$2" textAlign="center">
          Read the Privacy Policy
        </Button.Text>
        <Button.Solid scaleOnPress onPress={goToNextStep}>
          Continue
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
