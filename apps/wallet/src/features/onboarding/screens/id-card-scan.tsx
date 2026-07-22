import { useLingui } from '@lingui/react/macro'
import { useImageScaler } from '@package/app'
import { Button, NfcScannerModalAndroid, YStack } from '@package/ui'
import { Platform } from 'react-native'
import { ScanCard } from './assets/ScanCard'

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
  const { t } = useLingui()
  const { height, onLayout } = useImageScaler({ scaleFactor: 0.6 })

  const startScanningLabel = t({
    id: 'onboardingIdCardScan.startScanning',
    message: 'Start scanning',
    comment: 'Button label to begin scanning the ID card using NFC',
  })

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
            {startScanningLabel}
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
