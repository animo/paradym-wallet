import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { setupWalletServiceProvider } from '@easypid/crypto/WalletServiceProviderClient'
import { useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { commonMessages, TranslationProvider } from '@package/translations'
import { Heading, Paragraph, Stack, TamaguiProvider, YStack } from '@package/ui'
import type { DigitalCredentialsRequest } from '@paradym/wallet-sdk'
import { ParadymWalletAuthenticationInvalidPinError, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
import { useEffect, useRef, useState } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'

type DcApiSharingScreenProps = {
  request: DigitalCredentialsRequest
}

export function DcApiSharingScreen({ request }: DcApiSharingScreenProps) {
  const [storedLocale] = useStoredLocale()

  return (
    <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
      <TranslationProvider customLocale={storedLocale}>
        <TamaguiProvider disableInjectCSS defaultTheme="light" config={tamaguiConfig}>
          <SafeAreaProvider>
            <Stack flex-1 justifyContent="flex-end">
              <DcApiSharingScreenWithContext request={request} />
            </Stack>
          </SafeAreaProvider>
        </TamaguiProvider>
      </TranslationProvider>
    </ParadymWalletSdk.UnlockProvider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)
  const insets = useSafeAreaInsets()
  const { t } = useLingui()
  const paradym = useParadym()

  const onShareResponse = async (sdk: ParadymWalletSdk) => {
    const resolvedRequest = await sdk.dcApi
      .resolveRequest({ request })
      .then((resolvedRequest) => resolvedRequest)
      .catch((error) => {
        sdk.logger.error('Error getting credentials for dc api request', {
          error,
        })

        // Not shown to the user
        sdk.dcApi.sendErrorResponse('Presentation information could not be extracted')
      })

    if (!resolvedRequest) return

    // Once this returns we just assume it's successful
    try {
      await sdk.dcApi.sendResponse({
        dcRequest: request,
        resolvedRequest,
      })
    } catch (error) {
      sdk.logger.error('Could not share response', { error })

      // Not shown to the user
      sdk.dcApi.sendErrorResponse('Unable to share credentials')
      return
    }
  }

  useEffect(() => {
    if (!isProcessing || paradym.state !== 'acquired-wallet-key') return

    paradym
      .unlock()
      .then(async (sdk) => {
        await setupWalletServiceProvider(sdk)
        await onShareResponse(sdk)
      })
      .catch((error) => {
        if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
          pinRef.current?.clear()
          pinRef.current?.shake()
        }
      })
      .finally(() => setIsProcessing(false))
  }, [paradym, isProcessing])

  const onUnlockSdk = async (pin: string) => {
    if (paradym.state !== 'locked') return

    setIsProcessing(true)
    try {
      await paradym.unlockUsingPin(pin)
    } catch (_error) {
      pinRef.current?.clear()
      pinRef.current?.shake()
      setIsProcessing(false)
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
        <Heading>{t(commonMessages.enterPinToShareData)}</Heading>
        <Paragraph variant="annotation">{request.origin}</Paragraph>
      </YStack>

      <Stack pt="$5">
        <PinDotsInput
          onPinComplete={onUnlockSdk}
          isLoading={isProcessing || paradym.state === 'initializing'}
          pinLength={6}
          ref={pinRef}
          useNativeKeyboard={false}
        />
      </Stack>
    </YStack>
  )
}
