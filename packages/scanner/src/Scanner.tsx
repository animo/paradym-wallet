import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { AnimatePresence, Button, Heading, HeroIcons, Page, Paragraph, Spacer, XStack, YStack } from '@package/ui'
import MaskedView from '@react-native-masked-view/masked-view'
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera'
import { useCallback, useEffect, useState } from 'react'
import { Linking, StyleSheet } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'

interface BarcodeScannerProps {
  onScan(data: string): void
  onCancel?(): void
  helpText?: string
}

export const QrScanner = ({ onScan, onCancel, helpText }: BarcodeScannerProps) => {
  const [requestPermissionResult, setRequestPermissionResult] = useState<null | 'pending' | boolean>(null)
  const { hasPermission, requestPermission } = useCameraPermission()

  const { t } = useLingui()

  const device = useCameraDevice('back')
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const code = codes[0]
      if (!code) return
      if (!code.value) return

      onScan(code.value)
    },
  })

  useEffect(() => {
    if (hasPermission || requestPermissionResult !== null) return

    setRequestPermissionResult('pending')
    requestPermission().then((result) => setRequestPermissionResult(result))
  }, [hasPermission, requestPermission, requestPermissionResult])

  const _openAppSetting = useCallback(() => {
    void Linking.openSettings()
  }, [])

  if (requestPermissionResult === false) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading heading="h2" letterSpacing={-0.5}>
          <Trans id="qrScanner.permissionHeading" comment="Heading asking user to allow camera permission">
            Please allow camera access
          </Trans>
        </Heading>
        <Paragraph textAlign="center">
          <Trans id="qrScanner.permissionDescription" comment="Description explaining why camera permission is needed">
            This allows the app to scan QR codes that include credentials or data requests.
          </Trans>
        </Paragraph>
        <Button.Text onPress={() => _openAppSetting()}>{t(commonMessages.openSettingsButton)}</Button.Text>
      </Page>
    )
  }

  if (!device) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading heading="h2" letterSpacing={-0.5}>
          <Trans
            id="qrScanner.noCameraHeader"
            comment="Heading informing the user the device does not have a back camera"
          >
            No camera found
          </Trans>
        </Heading>
        <Paragraph textAlign="center">
          <Trans id="qrScanner.noCameraDescription" comment="Description explaining why camera permission is needed">
            This device does not have a camera. Unable to scan QR codes
          </Trans>
        </Paragraph>
      </Page>
    )
  }

  return (
    <Page f={1} fd="column" jc="space-between" bg="$black">
      <SystemBars style="light" />
      {hasPermission && (
        <Camera
          style={[StyleSheet.absoluteFill]}
          resizeMode="cover"
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />
      )}
      <YStack zi="$5" ai="center">
        <Heading heading="h1" lineHeight={36} ta="center" dark py="$8" maxWidth="80%">
          <Trans id="qrScanner.instructionHeading" comment="Instruction heading for scanning a QR code">
            Use the camera to scan a QR code
          </Trans>
        </Heading>
        <XStack maxHeight="$10">
          <AnimatePresence>
            {helpText && (
              <XStack
                key="scan-help-text"
                enterStyle={{ opacity: 0, scale: 0.5, y: 25 }}
                exitStyle={{ opacity: 0, scale: 1, y: 25 }}
                y={0}
                opacity={1}
                scale={1}
                animation="quick"
                bg="$warning-500"
                br="$12"
                px="$3"
                py="$1.5"
                gap="$2"
                ai="center"
              >
                <HeroIcons.ExclamationTriangleFilled size={16} color="$grey-900" />
                <Paragraph color="$grey-900" numberOfLines={1} variant="caption">
                  {helpText}
                </Paragraph>
              </XStack>
            )}
          </AnimatePresence>
        </XStack>
      </YStack>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <YStack f={1}>
            <YStack f={1} bg="$black" />
            <XStack f={2} borderTopWidth="$12" borderBottomWidth="$12">
              <YStack p={24} bg="$black" />
              <YStack f={1} />
              <YStack p={24} bg="$black" />
            </XStack>
            <YStack f={1} bg="$black" />
          </YStack>
        }
      >
        <XStack style={StyleSheet.absoluteFill} bg="$darkTranslucent" />
      </MaskedView>
      <YStack jc="center" ai="center" gap="$4">
        {onCancel && (
          <XStack>
            <Button.Solid
              h="$3.5"
              px="$5"
              br="$12"
              bg="$grey-100"
              color="$grey-900"
              flexDirection="row"
              onPress={onCancel}
              scaleOnPress
              alignSelf="center"
            >
              {t(commonMessages.cancel)}
            </Button.Solid>
          </XStack>
        )}
        <Spacer />
      </YStack>
    </Page>
  )
}
