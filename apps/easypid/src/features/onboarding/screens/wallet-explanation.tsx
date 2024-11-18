import { Button, HeroIcons, IllustrationContainer, YStack } from '@package/ui'
import { Image } from '@tamagui/image'
import React from 'react'

interface OnboardingWalletExplanationProps {
  image: number
  onSkip: () => void
  goToNextStep: () => void
}

export function OnboardingWalletExplanation({ image, onSkip, goToNextStep }: OnboardingWalletExplanationProps) {
  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <IllustrationContainer variant="feature">
          <Image br="$6" source={image} width={64} height={64} />
        </IllustrationContainer>
      </YStack>
      <YStack gap="$4">
        <Button.Text onPress={onSkip}>
          <HeroIcons.ArrowRight size={20} /> Skip introduction
        </Button.Text>
        <Button.Solid onPress={goToNextStep}>Continue</Button.Solid>
      </YStack>
    </YStack>
  )
}
