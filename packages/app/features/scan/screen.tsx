import { QrTypes, parseCredentialOffer, parseProofRequest } from '@internal/agent'
import { QrScanner } from '@internal/scanner'
import { useToastController } from '@internal/ui'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'solito/router'

export function QrScannerScreen() {
  const { push } = useRouter()
  const toast = useToastController()

  const [scannedData, setScannedData] = useState('')
  const [readData, setReadData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [helpText, setHelpText] = useState('')

  useEffect(() => {
    const onScan = async (data: string) => {
      // don't do anything if we already scanned the data
      // and the helpText is shown
      if (scannedData === readData && helpText) return
      setScannedData(data)
      if (scannedData.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE)) {
        setIsProcessing(true)
        await parseCredentialOffer({ data })
          .then(() => toast.show('Success!'))
          .catch(() => toast.show('Fail!'))
          .finally(() => push('/'))
      } else if (scannedData.startsWith(QrTypes.OPENID)) {
        setIsProcessing(true)
        await parseProofRequest({ data })
          .then(() => toast.show('Success!'))
          .catch(() => toast.show('Fail!'))
          .finally(() => push('/'))
      } else {
        setReadData(data)
        setHelpText('That does not seem right. Try again.')
      }
      setIsProcessing(false)
    }

    if (scannedData) void onScan(scannedData)
  }, [scannedData])

  return (
    <QrScanner
      onScan={(data) => setScannedData(data)}
      isProcessing={isProcessing}
      helpText={helpText}
    />
  )
}
