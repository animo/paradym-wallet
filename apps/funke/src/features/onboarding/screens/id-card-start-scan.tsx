import { Button, Stack } from '@package/ui'

import { NfcCardScanningPlacementImage } from '@package/ui/src/images/NfcScanningCardPlacementImage'

interface OnboardingIdCardStartScanProps {
  goToNextStep: () => void
}

export function OnboardingIdCardStartScan({ goToNextStep }: OnboardingIdCardStartScanProps) {
  return (
    <Stack flex-1>
      <Stack flex={3}>
        <NfcCardScanningPlacementImage height="80%" />
      </Stack>
      <Stack flex-1 justifyContent="flex-end">
        <Button.Solid onPress={goToNextStep}>Start scanning</Button.Solid>
      </Stack>
    </Stack>
  )
}
