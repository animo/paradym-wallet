import { mmkv } from '@easypid/storage/mmkv'
import { isIos, useHaptics } from '@package/app'
import { AnimatedStack, Button, Heading, Loader, Page, Paragraph, Spacer, Stack, XStack, YStack } from '@package/ui'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, useWindowDimensions } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import QRCode from 'react-native-qrcode-svg'

import { useAppIcon } from '@easypid/config/copy'
import { SystemBars } from 'react-native-edge-to-edge'
import {
  checkMdocPermissions,
  getMdocQrCode,
  isDataTransferInitialized,
  requestMdocPermissions,
  shutdownDataTransfer,
  waitForDeviceRequest,
} from '../proximity'

export function FunkeOfflineQrScreen() {
  const appIcon = useAppIcon()
  const { withHaptics } = useHaptics()
  const { replace, back } = useRouter()
  const { width } = useWindowDimensions()
  const [qrCodeData, setQrCodeData] = useState<string>()
  const [arePermissionsGranted, setArePermissionsGranted] = useState(false)
  const [arePermissionsRequested, setArePermissionsRequested] = useMMKVBoolean('arePermissionsRequested', mmkv)

  useEffect(() => {
    void checkMdocPermissions().then((result) => {
      setArePermissionsGranted(!!result)
      if (!result) {
        void requestPermissions()
      }
    })

    if (isDataTransferInitialized()) {
      shutdownDataTransfer()
    }
  }, [])

  useEffect(() => {
    if (arePermissionsGranted) {
      void getMdocQrCode()
        .then(setQrCodeData)
        .catch(() => {
          // NOTE: iOS automatically handles Bluetooth permissions, so we can't
          // easily detect if they've been granted or not. This is a workaround
          // to ensure the user is aware of the need for permissions.
          if (isIos()) setArePermissionsGranted(false)
        })
    } else {
      setQrCodeData(undefined)
    }
  }, [arePermissionsGranted])

  const checkPermissions = async () => {
    if (isIos()) {
      // NOTE: iOS automatically asks for Bluetooth permissions when we try to use it.
      // We can't easily detect if permissions have been granted until we try to use Bluetooth
      // and get an error.
      return true
    }

    const permissions = await requestMdocPermissions()
    if (!permissions) {
      return false
    }

    // Check if any permission is in 'never_ask_again' state
    const hasNeverAskAgain = Object.values(permissions).some((status) => status === 'never_ask_again')
    if (hasNeverAskAgain) {
      return false
    }

    return await checkMdocPermissions()
  }

  const requestPermissions = async () => {
    // First request without checking the never_ask_again state
    if (!arePermissionsRequested) {
      const granted = await checkPermissions()
      setArePermissionsRequested(true)
      setArePermissionsGranted(granted)
      return
    }

    // Subsequent requests need to check for the never_ask_again state
    const granted = await checkPermissions()
    setArePermissionsGranted(granted)
  }

  useEffect(() => {
    if (!qrCodeData) return

    void waitForDeviceRequest().then((data) => {
      pushToOfflinePresentation({
        sessionTranscript: Buffer.from(data.sessionTranscript).toString('base64'),
        deviceRequest: Buffer.from(data.deviceRequest).toString('base64'),
      })
    })
  }, [qrCodeData])

  // Navigate to offline presentation route
  const pushToOfflinePresentation = withHaptics((data: { sessionTranscript: string; deviceRequest: string }) => {
    replace({
      pathname: '/notifications/offlinePresentation',
      params: data,
    })
  })

  if (arePermissionsGranted === false) {
    return (
      <Page justifyContent="center" alignItems="center">
        <Heading variant="h2" letterSpacing={-0.5}>
          Please allow bluetooth access
        </Heading>
        <Paragraph textAlign="center">This allows the app to share with a QR code.</Paragraph>
        <Button.Text onPress={() => Linking.openSettings()}>Open settings</Button.Text>
      </Page>
    )
  }

  return (
    <Page bg="$black" ai="center">
      <SystemBars style="light" />
      <AnimatedStack pt="$8" maxWidth="90%" gap="$2">
        <Heading variant="h1" lineHeight={36} ta="center" dark>
          Share with QR code
        </Heading>
        <Paragraph color="$grey-400">A verifier needs to scan your QR-Code.</Paragraph>
      </AnimatedStack>
      <AnimatedStack fg={1} pb="$12" jc="center">
        {qrCodeData ? (
          <Stack bg="$white" br="$8" p="$5">
            <QRCode
              logoBorderRadius={12}
              logoMargin={4}
              logo={appIcon?.uri}
              size={Math.min(width * 0.75, 272)}
              value={qrCodeData}
            />
          </Stack>
        ) : (
          <Loader variant="dark" />
        )}
      </AnimatedStack>
      <YStack jc="center" ai="center" gap="$4">
        <XStack>
          <Button.Solid
            h="$3.5"
            px="$5"
            br="$12"
            bg="$grey-100"
            color="$grey-900"
            flexDirection="row"
            onPress={back}
            scaleOnPress
            alignSelf="center"
          >
            Cancel
          </Button.Solid>
        </XStack>
        <Spacer />
      </YStack>
    </Page>
  )
}
