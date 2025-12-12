import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, Heading, Paragraph, XStack, YStack } from '../base'
import { AnimatedNfcScanIcon, ProgressBar } from '../content'
import { FloatingSheet } from '../panels'

interface NfcScannerModalAndroidProps {
  scanningState: 'readyToScan' | 'scanning' | 'complete' | 'error'
  progress: number
  onCancel: () => void
  open: boolean
}

const nfcScanningMessages = {
  readyToScanTitle: defineMessage({
    id: 'nfcScanner.readyToScan.title',
    message: 'Ready to scan',
    comment: 'Title when the NFC scanner is ready to scan',
  }),
  readyToScanDescription: defineMessage({
    id: 'nfcScanner.readyToScan.description',
    message: 'Place your device on top of your eID card to scan it.',
    comment: 'Description when the NFC scanner is ready',
  }),
  scanningTitle: defineMessage({
    id: 'nfcScanner.scanning.title',
    message: 'Do not move the eID card',
    comment: 'Title while NFC scanning is in progress',
  }),
  scanningDescription: defineMessage({
    id: 'nfcScanner.scanning.description',
    message: 'Scanning in progress.',
    comment: 'Description while NFC scanning is in progress',
  }),
  completeTitle: defineMessage({
    id: 'nfcScanner.complete.title',
    message: 'Scan successful!',
    comment: 'Title when NFC scan completed successfully',
  }),
  completeDescription: defineMessage({
    id: 'nfcScanner.complete.description',
    message: 'You can now remove your eID card.',
    comment: 'Description when NFC scan completed successfully',
  }),
  errorTitle: defineMessage({
    id: 'nfcScanner.error.title',
    message: 'Scan failed',
    comment: 'Title when NFC scan failed',
  }),
  errorDescription: defineMessage({
    id: 'nfcScanner.error.description',
    message: 'Please try again.',
    comment: 'Description when NFC scan failed',
  }),
}

export const NfcScannerModalAndroid = ({ onCancel, open, scanningState, progress }: NfcScannerModalAndroidProps) => {
  const { t } = useLingui()

  const text = {
    readyToScan: {
      title: t(nfcScanningMessages.readyToScanTitle),
      description: t(nfcScanningMessages.readyToScanDescription),
    },
    scanning: {
      title: t(nfcScanningMessages.scanningTitle),
      description: t(nfcScanningMessages.scanningDescription),
    },
    complete: {
      title: t(nfcScanningMessages.completeTitle),
      description: t(nfcScanningMessages.completeDescription),
    },
    error: {
      title: t(nfcScanningMessages.errorTitle),
      description: t(nfcScanningMessages.errorDescription),
    },
  }
  const { title, description } = text[scanningState]

  return (
    <FloatingSheet
      isOpen={open}
      onDismiss={onCancel}
      setIsOpen={() => {}}
      enableDismissOnClose={false}
      enablePanDownToClose={false}
    >
      <XStack backgroundColor="$primary-100" height={175} justifyContent="center" alignItems="center">
        <AnimatedNfcScanIcon
          icon={scanningState === 'readyToScan' || scanningState === 'scanning' ? 'scan' : scanningState}
        />
      </XStack>

      <YStack gap="$4" flex-1 p="$4" justifyContent="space-between">
        <YStack gap="$2" alignItems="center" px="$5">
          <Heading heading="h2" textAlign="center">
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
          <Button.Outline onPress={onCancel}>{t(commonMessages.cancel)}</Button.Outline>
        )}
      </YStack>
    </FloatingSheet>
  )
}
