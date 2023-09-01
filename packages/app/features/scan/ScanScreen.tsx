import { QrScanner } from '@internal/scanner'
import { Page, Spinner, Paragraph } from '@internal/ui'
import { sleep } from '@tanstack/query-core/build/lib/utils'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import { useRouter } from 'solito/router'

import { useCredentialDataHandler } from 'app/hooks/useCredentialDataHandler'
import { isAndroid } from 'app/utils/platform'

const unsupportedUrlPrefixes = ['_oob=']

export function QrScannerScreen() {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()

  const [helpText, setHelpText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const onScan = async (scannedData: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setIsLoading(true)

    const result = await handleCredentialData(scannedData)

    if (result.result === 'error') {
      const isUnsupportedUrl = unsupportedUrlPrefixes.find((x) => scannedData.includes(x))
      setHelpText(
        isUnsupportedUrl
          ? 'This QR-code is not supported yet. Try scanning a different one.'
          : result.message
          ? result.message
          : 'Invalid QR code. Try scanning a different one.'
      )

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setIsLoading(false)
    }

    await sleep(5000)
    setHelpText('')
    setIsLoading(false)
    setIsProcessing(false)
  }

  // Only show cancel button on Android
  const onCancel = isAndroid() ? () => back() : undefined

  return (
    <>
      <QrScanner
        onScan={() => {
          void onScan
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
