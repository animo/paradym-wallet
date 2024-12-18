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
import { useHaptics } from 'packages/app/src'
import { useEffect, useState } from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import easypidLogo from '../../../assets/icon-rounded.png'
import { checkMdocPermissions, shutdownDataTransfer, waitForDeviceRequest } from '../proximity'

export function FunkeOfflineQrScreen() {
  const { withHaptics } = useHaptics()
  const { replace, back } = useRouter()
  const { width } = useWindowDimensions()
  const toast = useToastController()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>()
  const [arePermissionsGranted, setArePermissionsGranted] = useState(false)

  useEffect(() => {
    void checkMdocPermissions().then((result) => {
      setArePermissionsGranted(!!result)
    })
  }, [])

  useEffect(() => {
    if (qrCodeData) {
      void waitForDeviceRequest().then((data) => {
        if (data) {
          pushToOfflinePresentation({
            sessionTranscript: Buffer.from(data.sessionTranscript).toString('base64'),
            deviceRequest: Buffer.from(data.deviceRequest).toString('base64'),
          })
          return
        }
      })
    }
  }, [qrCodeData])

  // Navigate to offline presentation route
  const pushToOfflinePresentation = withHaptics((data: { sessionTranscript: string; deviceRequest: string }) =>
    replace({
      pathname: '/notifications/offlinePresentation',
      params: data,
    })
  )

  // useEffect(() => {
  //   // Cleanup function that runs when component unmounts
  //   return () => {
  //     shutdownDataTransfer()
  //   }
  // }, [])

  const onCancel = () => {
    back()
    shutdownDataTransfer()
  }

  // if (Platform.OS === 'ios') {
  //   toast.show('This feature is not supported on your OS yet.', { customData: { preset: 'warning' } })
  //   return back()
  // }

  return (
    <Page bg="$black" ai="center">
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
              logo={easypidLogo}
              size={Math.min(width * 0.75, 272)}
              value={qrCodeData}
            />
          </Stack>
        ) : (
          <Loader variant="dark" />
        )}
      </AnimatedStack>
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
              Cancel
            </Button.Solid>
          </XStack>
        )}
        <Spacer />
      </YStack>
    </Page>
  )
}
