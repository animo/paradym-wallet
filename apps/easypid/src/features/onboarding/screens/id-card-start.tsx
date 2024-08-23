import { Button, IdCardImage, Stack } from '@package/ui'

import { IllustrationContainer } from '@package/ui'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => void
}

export function OnboardingIdCardStart({ goToNextStep }: OnboardingIdCardStartScanProps) {
  return (
    <Stack fg={1}>
      <IllustrationContainer>
        <IdCardImage height={52} width={256} />
      </IllustrationContainer>
      <Stack flex-1 justifyContent="flex-end">
        <Button.Solid onPress={goToNextStep}>Continue</Button.Solid>
      </Stack>
    </Stack>
  )
}
