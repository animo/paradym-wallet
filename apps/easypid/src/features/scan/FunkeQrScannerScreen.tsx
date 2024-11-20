import { QrScanner } from '@package/scanner'
import {
  AnimatedStack,
  Heading,
  HeroIcons,
  Loader,
  Page,
  Paragraph,
  Spinner,
  Stack,
  useSpringify,
  useToastController,
} from '@package/ui'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-native-qrcode-svg'

import { type CredentialDataHandlerOptions, isAndroid, useCredentialDataHandler, useHaptics } from '@package/app'
import { Platform, useWindowDimensions } from 'react-native'
import { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { pidSchemes } from '@easypid/constants'
import easypidLogo from '../../../assets/easypid.png'
import { checkMdocPermissions, getMdocQrCode, requestMdocPermissions, waitForDeviceRequest } from '../proximity'

const unsupportedUrlPrefixes = ['_oob=']

interface QrScannerScreenProps {
  credentialDataHandlerOptions?: CredentialDataHandlerOptions
}

export function FunkeQrScannerScreen({ credentialDataHandlerOptions }: QrScannerScreenProps) {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()
  const { bottom, top } = useSafeAreaInsets()
  const toast = useToastController()
  const isFocused = useIsFocused()

  const [showMyQrCode, setShowMyQrCode] = useState(false)
  const [helpText, setHelpText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>()
  const [arePermissionsGranted, setArePermissionsGranted] = useState(false)

  useEffect(() => {
    void checkMdocPermissions().then((result) => setArePermissionsGranted(!!result))
  }, [])

  useEffect(() => {
    if (showMyQrCode) {
      void getMdocQrCode().then(setQrCodeData)
    } else {
      setQrCodeData(undefined)
    }
  }, [showMyQrCode])

  const onCancel = () => back()

  const onScan = async (scannedData: string) => {
    if (isProcessing || !isFocused) return
    setIsProcessing(true)
    setIsLoading(true)

    const result = await handleCredentialData(scannedData, credentialDataHandlerOptions)
    if (!result.success) {
      const isUnsupportedUrl =
        unsupportedUrlPrefixes.find((x) => scannedData.includes(x)) || result.error === 'invitation_type_not_allowed'
      setHelpText(
        isUnsupportedUrl
          ? 'This QR-code is not supported yet. Try scanning a different one.'
          : result.message
            ? result.message
            : 'Invalid QR code. Try scanning a different one.'
      )
      setIsLoading(false)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
    setHelpText('')
    setIsLoading(false)
    setIsProcessing(false)
  }

  const animatedQrOverlayOpacity = useAnimatedStyle(
    () => ({
      opacity: withTiming(showMyQrCode ? 1 : 0, { duration: showMyQrCode ? 300 : 200 }),
    }),
    [showMyQrCode]
  )

  const handleQrButtonPress = async () => {
    if (Platform.OS === 'ios') {
      toast.show('This feature is not supported on iOS yet.', { customData: { preset: 'warning' } })
      return
    }

    if (arePermissionsGranted) {
      setShowMyQrCode(true)
    } else {
      // FIXME: probably need to handle when you cancel the permission request
      // Or when you are blocked from asking (user needs to manually change in settings)
      await requestMdocPermissions().then(() => setArePermissionsGranted(true))
    }
  }

  return (
    <>
      <QrScanner
        onScan={(data) => {
          void onScan(data)
        }}
        helpText={helpText}
      />
      <Stack zi="$5" position="absolute" top={isAndroid() ? top : 0} right={0} bottom={0}>
        <Stack
          accessibilityRole="button"
          aria-label={`Close QR ${showMyQrCode ? 'scanner' : 'screen'}`}
          p="$4"
          onPress={onCancel}
        >
          <HeroIcons.X size={24} color="$grey-400" />
        </Stack>
      </Stack>

      <AnimatedStack bg="$black" style={animatedQrOverlayOpacity} pos="absolute" top={0} left={0} right={0} bottom={0}>
        {showMyQrCode && <FunkeQrOverlay qrCodeData={qrCodeData} />}
      </AnimatedStack>

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
      <Page
        bg="transparent"
        position="absolute"
        alignItems="center"
        justifyContent="flex-end"
        bottom={0}
        left={0}
        right={0}
        pb={bottom * 2}
      >
        <AnimatedStack
          alignItems="center"
          layout={useSpringify(LinearTransition)}
          onPress={handleQrButtonPress}
          bg="$grey-100"
          br="$12"
          py="$2.5"
          px="$5"
          accessibilityRole="button"
          aria-label={showMyQrCode ? 'Scan QR code' : 'Show my QR code'}
          minWidth={150}
        >
          <AnimatedStack
            key={showMyQrCode ? 'scan-qr-code' : 'show-my-qr-code'}
            entering={FadeIn.delay(200).duration(200)}
            exiting={FadeOut.duration(200)}
            flexDirection="row"
            ai="center"
            gap="$2"
          >
            <Paragraph fontWeight="$semiBold" ai="center" ta="center" color="$grey-900">
              {showMyQrCode ? 'Scan QR code' : 'Show my QR code'}
            </Paragraph>
            {showMyQrCode ? (
              <HeroIcons.CameraFilled size={20} color="$grey-900" />
            ) : (
              <HeroIcons.QrCode size={20} color="$grey-900" />
            )}
          </AnimatedStack>
        </AnimatedStack>
      </Page>
    </>
  )
}

function FunkeQrOverlay({ qrCodeData }: { qrCodeData?: string }) {
  const { width } = useWindowDimensions()
  const { bottom, top } = useSafeAreaInsets()
  const { withHaptics } = useHaptics()
  const { replace } = useRouter()

  useEffect(() => {
    if (qrCodeData) {
      void waitForDeviceRequest().then((data) => {
        if (data) {
          // Take the Doc item that matches with the mdoc pid type
          // Only support one doc item for now

          const requestedNamespace = data.requestedItems[0][pidSchemes.msoMdocDoctypes[0]]
          if (!requestedNamespace) throw new Error('Unsupported credential requested.')

          pushToOfflinePresentation({
            sessionTranscript: Buffer.from(data.sessionTranscript).toString('base64'),
            deviceRequest: Buffer.from(data.deviceRequest).toString('base64'),
            requestedAttributes: Object.entries(requestedNamespace).map(([key]) => key),
          })
          return
        }
      })
    }
  }, [qrCodeData])

  // Navigate to offline presentation route
  const pushToOfflinePresentation = withHaptics(
    (data: { sessionTranscript: string; deviceRequest: string; requestedAttributes: string[] }) =>
      replace({
        pathname: '/notifications/offlinePresentation',
        params: {
          ...data,
          requestedAttributes: JSON.stringify(data.requestedAttributes), // Add this change
        },
      })
  )

  return (
    <Page bg="$black" ai="center" pt={isAndroid() ? top : 0} pb={bottom}>
      <AnimatedStack pt="$8" maxWidth="90%" gap="$2" entering={FadeIn.duration(200).delay(300)}>
        <Heading variant="h1" lineHeight={36} ta="center" dark>
          Share with QR code
        </Heading>
        <Paragraph color="$grey-400">A verifier needs to scan your QR-Code.</Paragraph>
      </AnimatedStack>
      <AnimatedStack entering={FadeIn.duration(200).delay(300)} fg={1} pb="$12" jc="center">
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
      <Stack h="$4" />
    </Page>
  )
}
