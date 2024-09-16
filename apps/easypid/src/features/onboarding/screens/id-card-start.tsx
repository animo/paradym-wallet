import { Button, HeroIcons, IdCardImage, Spinner, Stack } from '@package/ui'

import { IllustrationContainer } from '@package/ui'
import { useState } from 'react'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => Promise<void>
  onSkipCardSetup: () => void
}

export function OnboardingIdCardStart({ goToNextStep, onSkipCardSetup }: OnboardingIdCardStartScanProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onSetupLater = () => {
    if (isLoading) return

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
    <Stack fg={1}>
      <IllustrationContainer>
        <IdCardImage height={52} width={256} />
      </IllustrationContainer>
      <Stack gap="$4" flex-1 justifyContent="flex-end">
        <Button.Text icon={HeroIcons.ArrowRight} scaleOnPress onPress={onSetupLater}>
          Set up later
        </Button.Text>
        <Button.Solid scaleOnPress disabled={isLoading} onPress={onContinue}>
          {isLoading ? <Spinner variant="dark" /> : 'Continue'}
        </Button.Solid>
      </Stack>
    </Stack>
  )
}
