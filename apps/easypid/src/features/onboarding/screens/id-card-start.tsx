import { Button, IdCardImage, Spinner, Stack } from '@package/ui'

import { IllustrationContainer } from '@package/ui'
import { useState } from 'react'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => Promise<void>
}

export function OnboardingIdCardStart({ goToNextStep }: OnboardingIdCardStartScanProps) {
  const [isLoading, setIsLoading] = useState(false)

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
      <Stack flex-1 justifyContent="flex-end">
        <Button.Solid disabled={isLoading} onPress={onContinue}>
          {isLoading ? <Spinner variant="dark" /> : 'Continue'}
        </Button.Solid>
      </Stack>
    </Stack>
  )
}
