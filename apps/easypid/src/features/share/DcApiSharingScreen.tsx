import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { initializeAppAgent } from '@easypid/agent'
import { resolveRequestForDcApi, sendErrorResponseForDcApi, sendResponseForDcApi } from '@package/agent'
import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import { Heading, Paragraph, Stack, TamaguiProvider, YStack } from '@package/ui'
import { useRef, useState } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { InvalidPinError } from '../../crypto/error'

type DcApiSharingScreenProps = {
  request: DigitalCredentialsRequest
}

export function DcApiSharingScreen({ request }: DcApiSharingScreenProps) {
  return (
    <TamaguiProvider disableInjectCSS defaultTheme="light" config={tamaguiConfig}>
      <SafeAreaProvider>
        <Stack flex-1 justifyContent="flex-end">
          <DcApiSharingScreenWithContext request={request} />
        </Stack>
      </SafeAreaProvider>
    </TamaguiProvider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)
  const insets = useSafeAreaInsets()

  const onProofAccept = async (pin: string) => {
    setIsProcessing(true)

    const agent = await secureWalletKey
      .getWalletKeyUsingPin(pin, secureWalletKey.getWalletKeyVersion())
      .then(async (walletKey) => {
        const agent = await initializeAppAgent({
          walletKey,
          walletKeyVersion: secureWalletKey.getWalletKeyVersion(),
        })
        await setWalletServiceProviderPin(pin.split('').map(Number), false)
        return agent
      })
      .catch((e) => {
        setIsProcessing(false)
        if (e instanceof InvalidPinError) {
          pinRef.current?.clear()
          pinRef.current?.shake()
          return
        }

        sendErrorResponseForDcApi('Error initializing wallet')
      })
    if (!agent) return

    const resolvedRequest = await resolveRequestForDcApi({ agent, request })
      .then((resolvedRequest) => {
        // We can't hare multiple documents at the moment
        if (resolvedRequest.formattedSubmission.entries.length > 1) {
          throw new Error('Multiple cards requested, but only one card can be shared with the digital credentials api.')
        }

        return resolvedRequest
      })
      .catch((error) => {
        agent.config.logger.error('Error getting credentials for dc api request', {
          error,
        })

        sendErrorResponseForDcApi('Presentation information could not be extracted')
      })

    if (!resolvedRequest) return

    // Once this returns we just assume it's successful
    try {
      await sendResponseForDcApi({
        agent,
        dcRequest: request,
        resolvedRequest,
      })
    } catch (error) {
      agent.config.logger.error('Could not share response', { error })

      sendErrorResponseForDcApi('Unable to share credentials')
      return
    }
  }

  return (
    <YStack
      borderTopLeftRadius="$8"
      borderTopRightRadius="$8"
      backgroundColor="white"
      gap="$5"
      p="$4"
      paddingBottom={insets.bottom ?? '$6'}
    >
      <YStack>
        <Heading>Enter PIN to share data</Heading>
        <Paragraph variant="annotation">{request.origin}</Paragraph>
      </YStack>

      <Stack pt="$5">
        <PinDotsInput
          onPinComplete={onProofAccept}
          isLoading={isProcessing}
          pinLength={6}
          ref={pinRef}
          useNativeKeyboard={false}
        />
      </Stack>
    </YStack>
  )
}
