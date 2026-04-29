import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { useShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import {
  authorizeWalletFlow,
  clearWalletFlowAuthorization,
  isWalletAuthPromptError,
} from '@easypid/utils/authorizeWalletFlow'
import { TranslationProvider } from '@package/translations'
import { Stack, TamaguiProvider, YStack } from '@package/ui'
import { type DigitalCredentialsRequest, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
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
    <TranslationProvider customLocale={storedLocale}>
      <TamaguiProvider disableInjectCSS defaultTheme="light" config={tamaguiConfig}>
        <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
          <SafeAreaProvider>
            <Stack flex-1 justifyContent="flex-end">
              <DcApiSharingScreenWithContext request={request} />
            </Stack>
          </SafeAreaProvider>
        </ParadymWalletSdk.UnlockProvider>
      </TamaguiProvider>
    </TranslationProvider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const cloudHsmPinRef = useRef<string | undefined>(undefined)
  const onAuthorizationErrorRef = useRef<(() => void) | undefined>(undefined)
  const insets = useSafeAreaInsets()
  const paradym = useParadym()
  const [shouldUseCloudHsmValue] = useShouldUseCloudHsm()
  const shouldUseCloudHsm = shouldUseCloudHsmValue === true
  const authorizationMode: Exclude<SubmissionAuthorizationMode, 'none'> = shouldUseCloudHsm
    ? 'pin-only'
    : 'pin-or-biometrics'
  const isAuthorizing =
    isProcessing || paradym.state === 'acquired-wallet-key' || (paradym.state === 'locked' && paradym.isUnlocking)

  const onShareResponse = async (sdk: ParadymWalletSdk) => {
    const resolvedRequest = await sdk.dcApi
      .resolveRequest({ request })
      .then((resolvedRequest) => {
        // We can't share multiple documents at the moment
        if (resolvedRequest.formattedSubmission.entries.length > 1) {
          throw new Error('Multiple cards requested, but only one card can be shared with the digital credentials api.')
        }

        return resolvedRequest
      })
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
    if (isProcessing || paradym.state !== 'acquired-wallet-key') return

    setIsProcessing(true)
    paradym
      .unlock()
      .then(async (sdk) => {
        if (shouldUseCloudHsm) {
          if (!cloudHsmPinRef.current) throw new Error('PIN is required to use Cloud HSM')
          await setWalletServiceProviderPin(cloudHsmPinRef.current, false)
        }

        await setupWalletServiceProvider(sdk)
        await onShareResponse(sdk)
      })
      .catch((error) => {
        if (isWalletAuthPromptError(error)) {
          onAuthorizationErrorRef.current?.()
          return
        }

        throw error
      })
      .finally(() => {
        cloudHsmPinRef.current = undefined
        onAuthorizationErrorRef.current = undefined
        clearWalletFlowAuthorization()
        setIsProcessing(false)
      })
  }, [isProcessing, onShareResponse, paradym, shouldUseCloudHsm])

  const onAuthorize = async ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps = {}) => {
    onAuthorizationErrorRef.current = onAuthorizationError

    if (paradym.state === 'locked') {
      if (shouldUseCloudHsm) {
        if (!pin) throw new Error('PIN is required to use Cloud HSM')
        cloudHsmPinRef.current = pin
      }

      if (pin) {
        await paradym.unlockUsingPin(pin)
      } else {
        await paradym.tryUnlockingUsingBiometrics()
      }

      onAuthorized?.()
      return
    }

    if (paradym.state === 'unlocked') {
      setIsProcessing(true)
      try {
        await authorizeWalletFlow({
          mode: authorizationMode,
          pin,
        })

        if (shouldUseCloudHsm) {
          await setupWalletServiceProvider(paradym.paradym)
        }

        await onShareResponse(paradym.paradym)
        onAuthorized?.()
      } catch (error) {
        if (isWalletAuthPromptError(error)) {
          onAuthorizationError?.()
          return
        }

        throw error
      } finally {
        clearWalletFlowAuthorization()
        setIsProcessing(false)
      }
      return
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
      <Stack pt="$5">
        <WalletFlowAuthPrompt
          authMode={authorizationMode}
          onSubmit={onAuthorize}
          isLoading={isAuthorizing}
          annotation={request.origin}
        />
      </Stack>
    </YStack>
  )
}
