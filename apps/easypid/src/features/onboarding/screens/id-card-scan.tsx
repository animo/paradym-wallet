import { Button, NfcScannerModalAndroid, YStack } from '@package/ui'

import { useImageScaler } from 'packages/app/src/hooks'
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
  const { height, onLayout } = useImageScaler()

  return (
    <>
      <YStack fg={1} jc="space-between">
        <YStack f={1} ai="center" onLayout={onLayout}>
          <YStack height={height} mt="$4">
            <ScanCard />
          </YStack>
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
