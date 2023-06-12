import {
  isOpenIdCredentialOffer,
  isOpenIdPresentationRequest,
  parsePresentationFromOpenId,
} from '@internal/agent'
import { QrScanner } from '@internal/scanner'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

export function QrScannerScreen() {
  const { push } = useRouter()

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
        const presentationDefinition = await parsePresentationFromOpenId({ data: scannedData })
        push({
          pathname: '/notifications/presentation',
          query: {
            uri: encodeURIComponent(JSON.stringify(presentationDefinition)),
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
        ? 'This QR-code is not supported yet. Try another.'
        : 'This QR-code format can not be used. Try another.'
    )
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    //clear the help text after 5 seconds
    setTimeout(() => {
      setHelpText('')
    }, 5000)
  }

  return <QrScanner onScan={(data) => setScannedData(data)} helpText={helpText} />
}
