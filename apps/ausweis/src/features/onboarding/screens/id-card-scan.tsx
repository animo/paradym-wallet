import { NfcScannerModalAndroid, Stack } from '@package/ui'

import { NfcCardScanningPlacementImage } from '@package/ui/src/images/NfcScanningCardPlacementImage'
import { Platform } from 'react-native'

interface OnboardingIdCardScanProps {
  isCardAttached?: boolean
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  showScanModal: boolean
  onCancel: () => void
}

export function OnboardingIdCardScan({
  progress,
  scanningState,
  isCardAttached,
  onCancel,
  showScanModal,
}: OnboardingIdCardScanProps) {
  return (
    <>
      <Stack flex-1>
        <Stack flex={3}>
          <NfcCardScanningPlacementImage height="80%" />
        </Stack>
        {/* This is here to have the same layout as id-card-start-scan */}
        <Stack flex-1 />
      </Stack>
      {Platform.OS === 'android' && (
        <NfcScannerModalAndroid
          onCancel={onCancel}
          open={showScanModal}
          progress={progress}
          scanningState={scanningState === 'scanning' && !isCardAttached ? 'readyToScan' : scanningState}
        />
      )}
    </>
  )
}
