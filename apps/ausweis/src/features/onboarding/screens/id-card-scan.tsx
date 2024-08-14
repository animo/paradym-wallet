import { Stack } from '@package/ui'

import { NfcCardScanningPlacementImage } from '@package/ui/src/images/NfcScanningCardPlacementImage'

export function OnboardingIdCardScan() {
  return (
    <Stack flex-1>
      <Stack flex={3}>
        <NfcCardScanningPlacementImage height="80%" />
      </Stack>
      {/* This is here to have the same layout as id-card-start-scan */}
      <Stack flex-1 />
    </Stack>
  )
}
