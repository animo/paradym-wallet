import { setupWalletServiceProvider } from '@easypid/crypto/WalletServiceProviderClient'
import { refreshPidIfNeeded } from '@easypid/use-cases/RefreshPidUseCase'
import { useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef } from '@package/app'
import { commonMessages, TranslationProvider } from '@package/translations'
import { Heading, Paragraph, Stack, TamaguiProvider, YStack } from '@package/ui'
import type { DigitalCredentialsRequest } from '@paradym/wallet-sdk'
import { useParadym } from '@paradym/wallet-sdk'
import { useRef, useState } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'

type DcApiSharingScreenProps = {
  request: DigitalCredentialsRequest
}

export function DcApiSharingScreen({ request }: DcApiSharingScreenProps) {
  const [storedLocale] = useStoredLocale()

  return (
    <TranslationProvider customLocale={storedLocale}>
      <TamaguiProvider disableInjectCSS defaultTheme="light" config={tamaguiConfig}>
        <SafeAreaProvider>
          <Stack flex-1 justifyContent="flex-end">
            <DcApiSharingScreenWithContext request={request} />
          </Stack>
        </SafeAreaProvider>
      </TamaguiProvider>
    </TranslationProvider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const pinRef = useRef<PinDotsInputRef>(null)
  const insets = useSafeAreaInsets()
  const { t } = useLingui()
  const paradym = useParadym()

  const onShareResponse = async () => {
    if (paradym.state !== 'unlocked') {
      throw new Error(`Invalid state for paradym wallet sdk. Expected 'unlocked', received '${paradym.state}'`)
    }

    const resolvedRequest = await paradym.paradym.dcApi
      .resolveRequest({ request })
      .then((resolvedRequest) => {
        // We can't share multiple documents at the moment
        if (resolvedRequest.formattedSubmission.entries.length > 1) {
          throw new Error('Multiple cards requested, but only one card can be shared with the digital credentials api.')
        }

        return resolvedRequest
      })
      .catch((error) => {
        paradym.paradym.logger.error('Error getting credentials for dc api request', {
          error,
        })

        // Not shown to the user
        paradym.paradym.dcApi.sendErrorResponse('Presentation information could not be extracted')
      })

    if (!resolvedRequest) return

    // Once this returns we just assume it's successful
    try {
      await paradym.paradym.dcApi.sendResponse({
        dcRequest: request,
        resolvedRequest,
        refreshCredentialsCallback: refreshPidIfNeeded,
      })
    } catch (error) {
      paradym.paradym.logger.error('Could not share response', { error })

      // Not shown to the user
      paradym.paradym.dcApi.sendErrorResponse('Unable to share credentials')
      return
    }
  }

  const onUnlockSdk = async (pin: string) => {
    setIsProcessing(true)
    if (paradym.state === 'locked') {
      await paradym.unlockUsingPin(pin)
    }

    if (paradym.state === 'acquired-wallet-key') {
      const sdk = await paradym.unlock()
      await setupWalletServiceProvider(sdk)
    }

    if (paradym.state === 'unlocked') {
      await onShareResponse()
    }

    throw new Error(`Invalid state. Received: '${paradym.state}'`)
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
          isLoading={isProcessing}
          pinLength={6}
          ref={pinRef}
          useNativeKeyboard={false}
        />
      </Stack>
    </YStack>
  )
}
