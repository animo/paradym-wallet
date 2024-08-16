import { Button, Heading, Paragraph, Stack, YStack, XStack } from '../base'
import { Sheet } from 'tamagui'
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
    description: 'Place your phone on top of your eID card to start scanning',
  },
  scanning: {
    title: 'Do not move the eID card',
    description: 'Scanning is in progress...',
  },
  complete: {
    title: 'Scanning complete',
    description: 'You can now remove your eID Card',
  },
  error: {
    title: 'Error during scan',
    description: 'Please try again',
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
          {/* I don't understand tamagui sometimes. IT DOES NOT PICK UP THE $primary-100 here, but
            primary-500 does work fine. So we extract it from the theme :( */}
          <XStack backgroundColor="#dbe9fe" height={175} justifyContent="center" alignItems="center">
            <AnimatedNfcScanIcon
              icon={scanningState === 'readyToScan' || scanningState === 'scanning' ? 'scan' : scanningState}
              scanAnimated={scanningState === 'readyToScan'}
            />
          </XStack>

          <YStack flex-1 p="$4" justifyContent="space-between">
            <Stack>
              <Heading variant="h2">{title}</Heading>
              <Paragraph variant="text">{description}</Paragraph>
            </Stack>

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
