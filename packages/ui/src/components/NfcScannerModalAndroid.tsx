import { Button, Heading, Paragraph, XStack, YStack } from '../base'
import { AnimatedNfcScanIcon, ProgressBar } from '../content'
import { FloatingSheet } from '../panels'

interface NfcScannerModalAndroidProps {
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  onCancel: () => void
  open: boolean
}

const text = {
  readyToScan: {
    title: 'Ready to scan',
    description: 'Place your device on top of your eID card to scan it.',
  },
  scanning: {
    title: 'Do not move the eID card',
    description: 'Scanning in progress.',
  },
  complete: {
    title: 'Scan successful!',
    description: 'You can now remove your eID card.',
  },
  error: {
    title: 'Scan failed',
    description: 'Please try again.',
  },
}

export const NfcScannerModalAndroid = ({ onCancel, open, scanningState, progress }: NfcScannerModalAndroidProps) => {
  const { title, description } = text[scanningState]

  return (
    <FloatingSheet isOpen={open} onDismiss={onCancel} setIsOpen={() => {}}>
      <YStack height={400} borderRadius="$8" backgroundColor="$white" overflow="hidden">
        <XStack backgroundColor="$primary-100" height={175} justifyContent="center" alignItems="center">
          <AnimatedNfcScanIcon
            icon={scanningState === 'readyToScan' || scanningState === 'scanning' ? 'scan' : scanningState}
            scanAnimated={scanningState === 'readyToScan'}
          />
        </XStack>

        <YStack flex-1 p="$4" justifyContent="space-between">
          <YStack gap="$2" alignItems="center" px="$5">
            <Heading variant="h2" textAlign="center">
              {title}
            </Heading>
            <Paragraph variant="sub" textAlign="center">
              {description}
            </Paragraph>
          </YStack>

          {scanningState === 'scanning' && (
            <YStack px="$2" alignItems="center">
              <ProgressBar value={progress} />
            </YStack>
          )}

          {(scanningState === 'scanning' || scanningState === 'readyToScan') && (
            <Button.Outline onPress={onCancel}>Cancel</Button.Outline>
          )}
        </YStack>
      </YStack>
    </FloatingSheet>
  )
}
