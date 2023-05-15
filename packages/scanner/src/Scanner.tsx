import {
  H3,
  MockToast,
  Page,
  Paragraph,
  Spinner,
  TextButton,
  XStack,
  YStack,
  paddingSizes,
} from '@internal/ui'
import MaskedView from '@react-native-masked-view/masked-view'
import { BarCodeScanner as ExpoBarCodeScanner } from 'expo-barcode-scanner'
import { useCallback, useEffect, useState } from 'react'
import { Linking, StyleSheet } from 'react-native'

interface BarcodeScannerProps {
  onScan(data: string): void
  isProcessing: boolean
  helpText?: string
}

export const QrScanner = ({ onScan, isProcessing, helpText }: BarcodeScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean>()

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await ExpoBarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    }

    void getBarCodeScannerPermissions()
  }, [])

  const _openAppSetting = useCallback(async () => {
    // Open the custom settings if the app has one
    await Linking.openSettings()
  }, [])

  if (hasPermission === false) {
    return (
      <Page justifyContent="center" alignItems="center">
        <H3>Please allow camera access</H3>
        <Paragraph textAlign="center">
          This allows Paradym to scan QR codes that include credentials or data requests.
        </Paragraph>
        <TextButton onPress={() => _openAppSetting}>Open settings</TextButton>
      </Page>
    )
  }

  return (
    <Page f={1} fd="column" jc="space-between">
      <ExpoBarCodeScanner
        style={StyleSheet.absoluteFill}
        onBarCodeScanned={({ data }) => onScan(data)}
      />
      {isProcessing && (
        <YStack jc="center" ai="center" bg="$translucent" style={StyleSheet.absoluteFill}>
          <Spinner />
        </YStack>
      )}
      <YStack zi="$5">
        <H3 ta="center" dark p={paddingSizes.xl}>
          Use the camera to scan a QR code
        </H3>
      </YStack>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <YStack f={1} p={0}>
            <YStack f={1} bg="$black" />
            <XStack f={2} p={0}>
              <YStack w="$4" bg="$black" />
              <YStack f={1} />
              <YStack w="$4" bg="$black" />
            </XStack>
            <YStack f={1} bg="$black" p={0} />
          </YStack>
        }
      >
        <XStack style={StyleSheet.absoluteFill} bg="$translucent" />
      </MaskedView>
      {helpText && <MockToast message={helpText} />}
    </Page>
  )
}
