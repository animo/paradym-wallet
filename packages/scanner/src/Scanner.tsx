import type { StyleProp, ViewStyle } from 'react-native'

import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { AnimatePresence, Button, Heading, HeroIcons, Page, Paragraph, Spacer, XStack, YStack } from '@package/ui'
import MaskedView from '@react-native-masked-view/masked-view'
import { Camera, CameraView } from 'expo-camera'
import { useCallback, useEffect, useState } from 'react'
import { Dimensions, Linking, Platform, StyleSheet } from 'react-native'
import { SystemBars } from 'react-native-edge-to-edge'
interface BarcodeScannerProps {
  onScan(data: string): void
  onCancel?(): void
  helpText?: string
}

export const QrScanner = ({ onScan, onCancel, helpText }: BarcodeScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const { t } = useLingui()
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    }

    void getCameraPermissions()
  }, [])

  const _openAppSetting = useCallback(() => {
    void Linking.openSettings()
  }, [])

  // Android has issues with aspect ratio
  let cameraStyle: StyleProp<ViewStyle> = StyleSheet.absoluteFill
  if (Platform.OS === 'android') {
    const { width, height } = Dimensions.get('screen')
    const cameraWidth = (height / 16) * 9
    const widthOffset = -(cameraWidth - width) / 2
    cameraStyle = { height, width: cameraWidth, left: widthOffset }
  }

  if (hasPermission === false) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading variant="h2" letterSpacing={-0.5}>
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

  return (
    <Page f={1} fd="column" jc="space-between" bg="$black">
      <SystemBars style="light" />
      {hasPermission && (
        <CameraView
          style={[cameraStyle, StyleSheet.absoluteFill]}
          onBarcodeScanned={({ data }) => onScan(data)}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}
      <YStack zi="$5" ai="center">
        <Heading variant="h1" lineHeight={36} ta="center" dark py="$8" maxWidth="80%">
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
