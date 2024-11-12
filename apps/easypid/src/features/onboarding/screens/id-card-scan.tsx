import { AnimatedNfcScan, Button, NfcScannerModalAndroid, Stack, YStack } from '@package/ui'

import { Platform } from 'react-native'

export interface OnboardingIdCardScanProps {
  isCardAttached?: boolean
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  showScanModal: boolean
  onCancel: () => void
  onStartScanning?: () => Promise<void>
}

export function OnboardingIdCardScan({
  progress,
  scanningState,
  isCardAttached,
  onCancel,
  showScanModal,
  onStartScanning,
}: OnboardingIdCardScanProps) {
  return (
    <>
      <Stack flex-1>
        <YStack ai="center" w="45%">
          <AnimatedNfcScan />
        </YStack>

        <Stack flex-1 justifyContent="flex-end">
          {onStartScanning && (
            <Button.Solid scaleOnPress onPress={onStartScanning}>
              Start scanning
            </Button.Solid>
          )}
        </Stack>
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
