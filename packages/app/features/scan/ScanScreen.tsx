import { isOpenIdCredentialOffer, isOpenIdPresentationRequest } from '@internal/agent'
import { QrScanner } from '@internal/scanner'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

import { isAndroid } from 'app/utils/platform'

export function QrScannerScreen() {
  const { push, back } = useRouter()

  const [scannedData, setScannedData] = useState('')
  const [readData, setReadData] = useState('')
  const [helpText, setHelpText] = useState('')
  const [isScanModalFocused, setIsScanModalFocused] = useState(true)

  const unsupportedUrlPrefixes = ['c_i=', 'd_m=', 'oob=', '_oob=']

  // TODO: is there any other way we can detect a modal over modal?

  useEffect(() => {
    const onScan = async (data: string) => {
      // don't do anything if we already scanned the data
      if (scannedData === readData) return
      setScannedData(data)
      if (isOpenIdCredentialOffer(scannedData)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/credential',
          query: {
            uri: encodeURIComponent(scannedData),
          },
        })
        setIsScanModalFocused(false)
      } else if (isOpenIdPresentationRequest(scannedData)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        push({
          pathname: '/notifications/presentation',
          query: {
            uri: encodeURIComponent(scannedData),
          },
        })
        setIsScanModalFocused(false)
      } else {
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
