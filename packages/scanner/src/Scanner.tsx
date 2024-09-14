import type { StyleProp, ViewStyle } from 'react-native'

import { AnimatePresence, Button, Heading, LucideIcons, Page, Paragraph, Spacer, XStack, YStack } from '@package/ui'
import MaskedView from '@react-native-masked-view/masked-view'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useCallback, useEffect } from 'react'
import { Dimensions, Linking, Platform, StyleSheet } from 'react-native'

interface BarcodeScannerProps {
  onScan(data: string): void
  onCancel?(): void
  helpText?: string
  appName: string
}

export const QrScanner = ({ onScan, onCancel, helpText, appName }: BarcodeScannerProps) => {
  const [permission, requestPermission] = useCameraPermissions()

  useEffect(() => {
    if (!permission) return

    if (!permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission, requestPermission])

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

  if (permission && !permission.granted && !permission.canAskAgain) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading variant="h2">Please allow camera access</Heading>
        <Paragraph textAlign="center">
          This allows {appName} to scan QR codes that include credentials or data requests.
        </Paragraph>
        <Button.Text onPress={() => _openAppSetting()}>Open settings</Button.Text>
      </Page>
    )
  }

  return (
    <Page f={1} fd="column" jc="space-between" bg="$black">
      {permission?.granted && (
        <CameraView
          style={[cameraStyle, StyleSheet.absoluteFill]}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={({ data }) => onScan(data)}
        />
      )}
      <YStack zi="$5" ai="center">
        <Heading variant="h1" ta="center" dark py="$8" maxWidth="80%">
          Use the camera to scan a QR code
        </Heading>
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
          <Button.Text bg="$darkTranslucent" h="$2" br="$12" onPress={onCancel}>
            Cancel
          </Button.Text>
        )}
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
                px="$4"
                py="$2"
                jc="center"
                ai="center"
                gap="$2"
              >
                <LucideIcons.AlertOctagon size={16} />
                <Paragraph variant="text" size="$2" lineHeight={20}>
                  {helpText}
                </Paragraph>
              </XStack>
            )}
          </AnimatePresence>
        </XStack>
        <Spacer />
      </YStack>
    </Page>
  )
}
