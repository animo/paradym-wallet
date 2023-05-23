import {
  parseCredentialOffer,
  parseProofRequest,
  isOpenIdCredentialOffer,
  isOpenIdProofRequest,
  useAgent,
} from '@internal/agent'
import { QrScanner } from '@internal/scanner'
import { useToastController } from '@internal/ui'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { useLink } from 'solito/link'
import { useRouter } from 'solito/router'

export function QrScannerScreen() {
  const { agent } = useAgent()
  const { push } = useRouter()
  const toast = useToastController()

  const [scannedData, setScannedData] = useState('')
  const [readData, setReadData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [helpText, setHelpText] = useState('')

  const unsupportedUrlPrefixes = ['c_i=', 'd_m=', 'oob=', '_oob=']

  useEffect(() => {
    const onScan = async (data: string) => {
      // don't do anything if we already scanned the data
      if (scannedData === readData) return
      setScannedData(data)

      if (isOpenIdCredentialOffer(scannedData)) {
        setIsProcessing(true)
        await parseCredentialOffer({ agent, data })
          .then((result) => {
            if (!result) throw new Error('Wrong')
            push(`/notification/credential/${result.id}`)

            // eslint-disable-next-line no-console
            console.log(result)
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            toast.show('Success!')
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.log(e)
            toast.show('Fail!')
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          })
          .finally(() => push('/'))
      } else if (isOpenIdProofRequest(scannedData)) {
        setIsProcessing(true)
        await parseProofRequest({ data })
          .then(() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            toast.show('Success!')
          })
          .catch(() => {
            toast.show('Fail!')
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          })
          .finally(() => push('/'))
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
