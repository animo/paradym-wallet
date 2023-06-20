import { QrScanner } from '@internal/scanner'
import * as Haptics from 'expo-haptics'
import * as NavigationBar from 'expo-navigation-bar'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import { isAndroid } from 'app/utils/platform'

export function QrScannerScreen() {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()

  const [scannedData, setScannedData] = useState('')
  const [readData, setReadData] = useState('')
  const [helpText, setHelpText] = useState('')
  const [isScanModalFocused, setIsScanModalFocused] = useState(true)

  const unsupportedUrlPrefixes = ['c_i=', 'd_m=', 'oob=', '_oob=']

  // TODO: is there any other way we can detect a modal over modal?

  useEffect(() => {
    const onScan = (data: string) => {
      // don't do anything if we already scanned the data
      if (scannedData === readData) return
      setScannedData(data)

      const result = handleCredentialData(data)
      if (result.result === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setIsScanModalFocused(false)
      } else if (result.result === 'error') {
        setReadData(data)
        triggerHelpText(data)
      }
    }

    if (scannedData && isScanModalFocused) void onScan(scannedData)
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
    <QrScanner onScan={(data) => setScannedData(data)} onCancel={onCancel} helpText={helpText} />
  )
}
