import { isOpenIdCredentialOffer, isOpenIdProofRequest } from '@internal/agent'
import { QrScanner } from '@internal/scanner'
import { useToastController } from '@internal/ui'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

export function QrScannerScreen() {
  const { push, back } = useRouter()
  const toast = useToastController()

  const [scannedData, setScannedData] = useState('')
  const [readData, setReadData] = useState('')
  const [helpText, setHelpText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const unsupportedUrlPrefixes = ['c_i=', 'd_m=', 'oob=', '_oob=']

  useEffect(() => {
    const onScan = (data: string) => {
      // don't do anything if we already scanned the data
      if (scannedData === readData) return
      setIsProcessing(true)
      setScannedData(data)
      if (isOpenIdCredentialOffer(scannedData)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        back()
        push({
          pathname: '/notifications/credential',
          query: {
            uri: encodeURIComponent(scannedData),
          },
        })
      } else if (isOpenIdProofRequest(scannedData)) {
        toast.show('Fail!')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } else {
        setReadData(data)
        triggerHelpText(data)
      }
      setIsProcessing(false)
    }

    if (scannedData) void onScan(scannedData)
  }, [scannedData])

  const triggerHelpText = (data: string) => {
    const isUnsupportedUrl = unsupportedUrlPrefixes.find((f) => data.includes(f))
    setHelpText(
      isUnsupportedUrl
        ? 'This QR-code is not supported yet. Try another.'
        : 'This QR-code format can not be used. Try another.'
    )
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    //clear the help text after 3 seconds
    setTimeout(() => {
      setHelpText('')
    }, 5000)
  }

  return (
    <QrScanner
      onScan={(data) => setScannedData(data)}
      isProcessing={isProcessing}
      helpText={helpText}
    />
  )
}
