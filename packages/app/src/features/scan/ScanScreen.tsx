import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { QrScanner } from '@package/scanner'
import { Page, Paragraph, Spinner } from '@package/ui'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { type CredentialDataHandlerOptions, useCredentialDataHandler } from '../../hooks'

const unsupportedUrlPrefixes = ['_oob=']

interface QrScannerScreenProps {
  credentialDataHandlerOptions?: CredentialDataHandlerOptions
}

const qrMessages = {
  unsupportedQrCode: defineMessage({
    id: 'qrScan.unsupportedQrCode',
    message: 'Unsupported QR code. Try another.',
    comment: 'Shown when scanned QR code has unsupported URL prefix',
  }),
  invalidQrCode: defineMessage({
    id: 'qrScan.invalidQrCode',
    message: 'Invalid QR code. Try another.',
    comment: 'Shown when scanned QR code is invalid',
  }),
}

export function QrScannerScreen({ credentialDataHandlerOptions }: QrScannerScreenProps) {
  const isProcessing = useRef<boolean>(false)
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()
  const { t } = useLingui()
  const [helpText, setHelpText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const isFocused = useIsFocused()

  const onScan = async (scannedData: string) => {
    if (isProcessing.current || !isFocused) return
    isProcessing.current = true
    setIsLoading(true)

    const result = await handleCredentialData(scannedData, credentialDataHandlerOptions)
    if (!result.success) {
      const isUnsupportedUrl =
        unsupportedUrlPrefixes.find((x) => scannedData.includes(x)) || result.error === 'invitation_type_not_allowed'
      setHelpText(
        isUnsupportedUrl
          ? t(qrMessages.unsupportedQrCode)
          : result.message
            ? result.message
            : t(qrMessages.invalidQrCode)
      )
      setIsLoading(false)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
    setHelpText('')
    setIsLoading(false)
    isProcessing.current = false
  }

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
            <Trans id="qrScanScreen.loadingInvitation" comment="Text shown while an invitation is loading">
              Loading invitation
            </Trans>
          </Paragraph>
        </Page>
      )}
    </>
  )
}
