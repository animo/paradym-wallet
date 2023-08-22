import { QrScanner } from '@internal/scanner'
import { Page, Spinner, Paragraph } from '@internal/ui'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import { isAndroid } from 'app/utils/platform'

export function QrScannerScreen() {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()

  const [scannedData, setScannedData] = useState('')
  const [helpText, setHelpText] = useState('')
  const [isScanModalFocused, setIsScanModalFocused] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedInvalidQrs, setScannedInvalidQrs] = useState<string[]>([])

  const unsupportedUrlPrefixes = ['_oob=']

  // TODO: is there any other way we can detect a modal over modal?
  useEffect(() => {
    const onScan = async () => {
      if (isProcessing) return
      setIsProcessing(true)

      // don't do anything if we already scanned the data and the helpText is still shown
      if (helpText !== '' && scannedInvalidQrs.includes(scannedData)) return

      // Trigger help text if scanning a QR that is already scanned and was invalid
      if (scannedInvalidQrs.includes(scannedData)) {
        triggerHelpText(scannedData)
      }

      const result = await handleCredentialData(scannedData)
      if (result.result === 'success') {
        setIsScanModalFocused(false)
      } else if (result.result === 'error') {
        scannedInvalidQrs.push(scannedData)
        setScannedInvalidQrs((qrs) => [...qrs, scannedData])
        triggerHelpText(scannedData)
      }

      setIsProcessing(false)
    }

    if (scannedData && isScanModalFocused) void onScan()
  }, [scannedData])

  const triggerHelpText = (data: string) => {
    const isUnsupportedUrl = unsupportedUrlPrefixes.find((f) => data.includes(f))
    setHelpText(
      isUnsupportedUrl
        ? 'This QR-code is not supported yet. Try scanning a different one.'
        : 'Invalid QR code. Try scanning a different one.'
    )
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    //clear the help text after 5 seconds
    setTimeout(() => {
      setHelpText('')
    }, 5000)
  }

  // Only show cancel button on Android
  const onCancel = isAndroid() ? () => back() : undefined

  return (
    <>
      <QrScanner onScan={(data) => setScannedData(data)} onCancel={onCancel} helpText={helpText} />
      {isProcessing && (
        <Page
          position="absolute"
          jc="center"
          ai="center"
          g="md"
          enterStyle={{ opacity: 0, y: 50 }}
          exitStyle={{ opacity: 0, y: -20 }}
          y={0}
          bg="$black"
          opacity={0.7}
          animation="lazy"
        >
          <Spinner variant="dark" />
          <Paragraph variant="sub" color="$white" textAlign="center">
            Loading invitation
          </Paragraph>
        </Page>
      )}
    </>
  )
}
