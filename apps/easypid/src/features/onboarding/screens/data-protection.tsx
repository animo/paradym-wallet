import { Button, HeroIcons, Spinner, YStack } from '@package/ui'
import React, { useState } from 'react'
import { Linking } from 'react-native'
import { ProtectData } from './assets/ProtectData'

interface OnboardingDataProtectionProps {
  goToNextStep: () => Promise<void>
}

export function OnboardingDataProtection({ goToNextStep }: OnboardingDataProtectionProps) {
  const onPressPrivacy = () => {
    Linking.openURL('https://paradym.id/wallet-privacy-policy')
  }

  const [isLoading, setIsLoading] = useState(false)

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep().finally(() => setIsLoading(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack f={1} ai="center" mt="$-8" mb="$8" p="$8">
        <ProtectData />
      </YStack>
      <YStack gap="$4" alignItems="center">
        <Button.Text onPress={onPressPrivacy} py="$2" textAlign="center">
          Read the Privacy Policy <HeroIcons.Link size={20} />
        </Button.Text>
        <Button.Solid scaleOnPress disabled={isLoading} onPress={onContinue}>
          {isLoading ? <Spinner variant="dark" /> : 'Continue'}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
