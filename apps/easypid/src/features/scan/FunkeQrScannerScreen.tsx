import { QrScanner } from '@package/scanner'
import {
  AnimatedStack,
  Heading,
  HeroIcons,
  IconContainer,
  Loader,
  Page,
  Paragraph,
  Spinner,
  Stack,
  useSpringify,
} from '@package/ui'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-native-qrcode-svg'

import { type CredentialDataHandlerOptions, useCredentialDataHandler, useHaptics } from '@package/app'
import { useWindowDimensions } from 'react-native'
import { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import easypidLogo from '../../../assets/easypid.png'

const unsupportedUrlPrefixes = ['_oob=']

interface QrScannerScreenProps {
  credentialDataHandlerOptions?: CredentialDataHandlerOptions
}

export function FunkeQrScannerScreen({ credentialDataHandlerOptions }: QrScannerScreenProps) {
  const { back } = useRouter()
  const { handleCredentialData } = useCredentialDataHandler()
  const { bottom } = useSafeAreaInsets()
  const isFocused = useIsFocused()

  const [showMyQrCode, setShowMyQrCode] = useState(false)
  const [helpText, setHelpText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleQrButtonPress = () => {
    if (showMyQrCode) {
      pushToOfflinePresentation()
      return
    }
    setShowMyQrCode(!showMyQrCode)
  }

  // For testing purposes
  const { withHaptics } = useHaptics()
  const { replace } = useRouter()
  const pushToOfflinePresentation = withHaptics(() => replace('/notifications/offlinePresentation'))

  return (
    <>
      <QrScanner
        onScan={(data) => {
          void onScan(data)
        }}
        helpText={helpText}
      />
      <Stack zi="$5" position="absolute" top={0} right={0} bottom={0}>
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
        {showMyQrCode && <FunkeQrOverlay />}
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

function FunkeQrOverlay() {
  const { width } = useWindowDimensions()
  const { bottom } = useSafeAreaInsets()

  const [isQrVisible, setIsQrVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsQrVisible(true)
    }, 1000)
  }, [])

  return (
    <Page bg="$black" ai="center" pb={bottom}>
      <AnimatedStack pt="$8" maxWidth="90%" gap="$2" entering={FadeIn.duration(200).delay(300)}>
        <Heading variant="h1" lineHeight={36} ta="center" dark>
          Share with QR code
        </Heading>
        <Paragraph color="$grey-400">A verifier needs to scan your QR-Code.</Paragraph>
      </AnimatedStack>
      <AnimatedStack entering={FadeIn.duration(200).delay(300)} fg={1} pb="$12" jc="center">
        {isQrVisible ? (
          <Stack bg="$white" br="$8" p="$5">
            <QRCode
              logoBorderRadius={12}
              logoMargin={4}
              logo={easypidLogo}
              size={Math.min(width * 0.75, 272)}
              value="http://awesome.link.qr"
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
