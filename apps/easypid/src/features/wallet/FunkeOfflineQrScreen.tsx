import { mmkv } from '@easypid/storage/mmkv'
import { isIos, useHaptics } from '@package/app'
import {
  AnimatedStack,
  Button,
  Heading,
  Loader,
  Page,
  Paragraph,
  Spacer,
  Stack,
  XStack,
  YStack,
  useToastController,
} from '@package/ui'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Linking, useWindowDimensions } from 'react-native'
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
import { Trans, useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

export function FunkeOfflineQrScreen() {
  const appIcon = useAppIcon()
  const { withHaptics } = useHaptics()
  const { replace, back } = useRouter()
  const { width } = useWindowDimensions()
  const toast = useToastController()
  const { t } = useLingui()

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
      void getMdocQrCode().then(setQrCodeData)
    } else {
      setQrCodeData(undefined)
    }
  }, [arePermissionsGranted])

  const handlePermissions = async () => {
    if (isIos()) return { granted: true, shouldShowSettings: false }
    const permissions = await requestMdocPermissions()

    if (!permissions) {
      toast.show(
        t({
          id: 'offlineQr.permissionError',
          message: 'Failed to request permissions.',
          comment: 'Toast shown when system permission request fails',
        }),
        { customData: { preset: 'danger' } }
      )
      return { granted: false, shouldShowSettings: false }
    }

    // Check if any permission is in 'never_ask_again' state
    const hasNeverAskAgain = Object.values(permissions).some((status) => status === 'never_ask_again')

    if (hasNeverAskAgain) {
      return { granted: false, shouldShowSettings: true }
    }

    const permissionStatus = await checkMdocPermissions()
    return { granted: !!permissionStatus, shouldShowSettings: false }
  }

  const requestPermissions = async () => {
    // First request without checking the never_ask_again state
    if (!arePermissionsRequested) {
      const { granted } = await handlePermissions()
      setArePermissionsRequested(true)
      setArePermissionsGranted(granted)
      return
    }

    // Subsequent requests need to check for the never_ask_again state
    const { granted, shouldShowSettings } = await handlePermissions()

    if (shouldShowSettings) {
      back()
      Alert.alert(
        t({
          id: 'offlineQr.permissionSettingsTitle',
          message: 'Please enable required permissions in your phone settings',
          comment: 'This is a heading in a system alert that asks the user to go to Settings to enable Bluetooth/Location permissions',
        }),
        t({
          id: 'offlineQr.permissionSettingsDescription',
          message: 'Sharing with QR-Code needs access to Bluetooth and Location.',
          comment: 'This is a heading in a system alert that asks the user to go to Settings to enable Bluetooth/Location permissions',
        }),
        [
          {
            text: t({
              id: 'common.openSettings',
              message: 'Open Settings',
              comment: 'Button to open system settings from alert',
            }),
            onPress: () => Linking.openSettings(),
          },
        ]
      )
      return
    }

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

  return (
    <Page bg="$black" ai="center">
      <SystemBars style="light" />
      <AnimatedStack pt="$8" maxWidth="90%" gap="$2">
        <Heading variant="h1" lineHeight={36} ta="center" dark>
          <Trans id="offlineQr.heading" comment="Main heading for offline QR sharing screen">
            Share with QR code
          </Trans>
        </Heading>
        <Paragraph color="$grey-400">
          <Trans id="offlineQr.instruction" comment="Instruction for the verifier to scan the QR code">
            A verifier needs to scan your QR-Code.
          </Trans>
        </Paragraph>
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
            {t(commonMessages.cancel)}
          </Button.Solid>
        </XStack>
        <Spacer />
      </YStack>
    </Page>
  )
}
