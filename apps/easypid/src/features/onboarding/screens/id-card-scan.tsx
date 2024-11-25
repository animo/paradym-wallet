import { Button, NfcScannerModalAndroid, YStack } from '@package/ui'

import { Platform } from 'react-native'
import { ScanCard } from './assets/ScanCard'

interface OnboardingIdCardScanProps {
  isCardAttached?: boolean
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  showScanModal: boolean
  onCancel: () => void
  onStartScanning?: () => void
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
      <YStack fg={1} jc="space-between">
        <YStack f={1} ai="center" mt="$-8" mb="$8" p="$12">
          <ScanCard />
        </YStack>
        <YStack gap="$4" alignItems="center" opacity={onStartScanning ? 1 : 0}>
          <Button.Solid scaleOnPress onPress={onStartScanning}>
            Start scanning
          </Button.Solid>
        </YStack>
      </YStack>
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
