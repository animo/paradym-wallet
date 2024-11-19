import { Button, HeroIcons, IdCardImage, ScrollView, Spinner, YStack } from '@package/ui'

import { IllustrationContainer } from '@package/ui'
import { useState } from 'react'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => Promise<void>
  onSkipCardSetup?: () => void
}

export function OnboardingIdCardStart({ goToNextStep, onSkipCardSetup }: OnboardingIdCardStartScanProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onSetupLater = () => {
    if (isLoading || !onSkipCardSetup) return

    setIsLoading(true)
    onSkipCardSetup()
    setIsLoading(false)
  }

  const onContinue = () => {
    if (isLoading) return

    setIsLoading(true)
    goToNextStep().finally(() => setIsLoading(false))
  }

  return (
    <YStack fg={1} jc="space-between">
      <YStack flex={1} overflow="hidden">
        <ScrollView alwaysBounceVertical={false}>
          <YStack gap="$2" pb="$4">
            <IllustrationContainer>
              <IdCardImage height={52} width={256} />
            </IllustrationContainer>
          </YStack>
        </ScrollView>
      </YStack>
      <YStack gap="$4" alignItems="center">
        {onSkipCardSetup && (
          <Button.Text disabled={isLoading} icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
            Set up later
          </Button.Text>
        )}
        <Button.Solid scaleOnPress disabled={isLoading} onPress={onContinue}>
          {isLoading ? <Spinner variant="dark" /> : 'Continue'}
        </Button.Solid>
      </YStack>
    </YStack>
  )
}
