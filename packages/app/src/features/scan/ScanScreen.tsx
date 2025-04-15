import { QrScanner } from '@package/scanner'
import { Page, Paragraph, Spinner } from '@package/ui'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import { type CredentialDataHandlerOptions, useCredentialDataHandler } from '../../hooks'

const unsupportedUrlPrefixes = ['_oob=']

interface QrScannerScreenProps {
  credentialDataHandlerOptions?: CredentialDataHandlerOptions
}

export function QrScannerScreen({ credentialDataHandlerOptions }: QrScannerScreenProps) {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()

  const [helpText, setHelpText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const isFocused = useIsFocused()

  const onScan = async (scannedData: string) => {
    if (isProcessing || !isFocused) return
    setIsProcessing(true)
    setIsLoading(true)

    const result = await handleCredentialData(scannedData, credentialDataHandlerOptions)
    if (!result.success) {
      const isUnsupportedUrl =
        unsupportedUrlPrefixes.find((x) => scannedData.includes(x)) || result.error === 'invitation_type_not_allowed'
      setHelpText(
        isUnsupportedUrl
          ? 'Unsupported QR code. Try another.'
          : result.message
            ? result.message
            : 'Invalid QR code. Try another.'
      )
      setIsLoading(false)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
    setHelpText('')
    setIsLoading(false)
    setIsProcessing(false)
  }

  // Only show cancel button on Android
  const onCancel = () => back()

  return (
    <>
      <QrScanner
        onScan={(data) => {
          void onScan(data)
        }}
        onCancel={onCancel}
        helpText={helpText}
      />
      {isLoading && (
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
