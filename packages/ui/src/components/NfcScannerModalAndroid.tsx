import { Sheet } from 'tamagui'
import { Button, Heading, Paragraph, XStack, YStack } from '../base'
import { AnimatedNfcScanIcon, ProgressBar } from '../content'

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
    <Sheet
      open={open}
      modal
      // Anything else besides percent will add a weird white block to the bottom of the screen.
      // Ideally we use fit or constant as percent can differ quite a lot between screens
      // However we now set it to almost full screen and we just render a smaller constant box in the modal
      snapPoints={[90]}
      snapPointsMode="percent"
      disableDrag
      dismissOnOverlayPress={false}
    >
      <Sheet.Overlay bc="#00000033" animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
      <Sheet.Frame width="90%" justifyContent="flex-end" backgroundColor="transparent" alignSelf="center" bottom="5%">
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
      </Sheet.Frame>
    </Sheet>
  )
}
