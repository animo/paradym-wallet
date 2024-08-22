import { Button, Stack } from '@package/ui'

import { ImageContainer, NfcCardScanningPlacementImage } from '@package/ui'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => void
}

export function OnboardingIdCardStart({ goToNextStep }: OnboardingIdCardStartScanProps) {
  return (
    <Stack fg={1}>
      <ImageContainer>
        <Stack pt="$6">
          <NfcCardScanningPlacementImage height={224} width={224} />
        </Stack>
      </ImageContainer>
      <Stack flex-1 justifyContent="flex-end">
        <Button.Solid onPress={goToNextStep}>Continue</Button.Solid>
      </Stack>
    </Stack>
  )
}
