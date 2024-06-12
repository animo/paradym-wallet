import { QrScanner } from '@package/scanner'
import { Page, Spinner, Paragraph } from '@package/ui'
import { useIsFocused } from '@react-navigation/native'
import React, { useState } from 'react'
import { useRouter } from 'solito/router'

import { useCredentialDataHandler } from '../../hooks'
import { isAndroid } from '../../utils'

const unsupportedUrlPrefixes = ['_oob=']

export function QrScannerScreen() {
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

    const result = await handleCredentialData(scannedData)
    if (!result.success) {
      const isUnsupportedUrl = unsupportedUrlPrefixes.find((x) => scannedData.includes(x))
      setHelpText(
        isUnsupportedUrl
          ? 'This QR-code is not supported yet. Try scanning a different one.'
          : result.error
            ? result.error
            : 'Invalid QR code. Try scanning a different one.'
      )
      setIsLoading(false)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
    setHelpText('')
    setIsLoading(false)
    setIsProcessing(false)
  }

  // Only show cancel button on Android
  const onCancel = isAndroid() ? () => back() : undefined

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
