import { sendErrorResponse } from '@animo-id/expo-digital-credentials-api'
import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import { getOriginLabel, useOriginLogo } from '@easypid/features/flow/useOriginLogo'
import { WalletFlowErrorContent, WalletFlowShell } from '@easypid/features/flow/WalletFlowShell'
import { useShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import { useDevelopmentMode } from '@easypid/hooks'
import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import {
  authorizeWalletFlow,
  clearWalletFlowAuthorization,
  isWalletAuthPromptError,
} from '@easypid/utils/authorizeWalletFlow'
import { useLingui } from '@lingui/react/macro'
import { Provider } from '@package/app'
import { commonMessages } from '@package/translations'
import { Stack } from '@package/ui'
import { type DigitalCredentialsRequest, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
import { useEffect, useRef, useState } from 'react'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'

type DcApiSharingScreenProps = {
  request: DigitalCredentialsRequest
}

type FlowError = {
  message: string
  responseMessage: string
}

export function DcApiSharingScreen({ request }: DcApiSharingScreenProps) {
  const [storedLocale] = useStoredLocale()

  return (
    <Provider config={tamaguiConfig} customLocale={storedLocale} rootBackgroundColor="transparent">
      <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
        <Stack flex-1 justifyContent="flex-end" backgroundColor="transparent">
          <DcApiSharingScreenWithContext request={request} />
        </Stack>
      </ParadymWalletSdk.UnlockProvider>
    </Provider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const { t } = useLingui()
  const [isProcessing, setIsProcessing] = useState(false)
  const [flowError, setFlowError] = useState<FlowError>()
  const cloudHsmPinRef = useRef<string | undefined>(undefined)
  const onAuthorizationErrorRef = useRef<(() => void) | undefined>(undefined)
  const paradym = useParadym()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [shouldUseCloudHsmValue] = useShouldUseCloudHsm()
  const shouldUseCloudHsm = shouldUseCloudHsmValue === true
  const authorizationMode: Exclude<SubmissionAuthorizationMode, 'none'> = shouldUseCloudHsm
    ? 'pin-only'
    : 'pin-or-biometrics'
  const requestOrigin = request.origin ?? request.packageName
  const requestOriginLabel = getOriginLabel(requestOrigin)
  const requestOriginLogo = useOriginLogo(requestOrigin)
  const isAuthorizing =
    isProcessing || paradym.state === 'acquired-wallet-key' || (paradym.state === 'locked' && paradym.isUnlocking)

  const rejectRequest = (errorMessage: string) => sendErrorResponse({ errorMessage })

  const setFlowErrorFromError = ({
    reason,
    error,
    responseMessage,
  }: {
    reason: string
    error: unknown
    responseMessage: string
  }) => {
    const errorMessage =
      error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined

    setFlowError({
      message: errorMessage ? `${reason}\n${errorMessage}` : reason,
      responseMessage,
    })
  }

  const onShareResponse = async (sdk: ParadymWalletSdk) => {
    const resolveErrorMessage = t(commonMessages.presentationInformationCouldNotBeExtracted)
    const shareErrorMessage = t(commonMessages.presentationCouldNotBeShared)
    let resolvedRequest: Awaited<ReturnType<ParadymWalletSdk['dcApi']['resolveRequest']>>

    try {
      resolvedRequest = await sdk.dcApi.resolveRequest({ request })
    } catch (error) {
      sdk.logger.error('Error getting credentials for dc api request', {
        error,
      })

      setFlowErrorFromError({
        reason: resolveErrorMessage,
        error,
        responseMessage: resolveErrorMessage,
      })
      return false
    }

    try {
      await sdk.dcApi.sendResponse({
        dcRequest: request,
        resolvedRequest,
      })

      return true
    } catch (error) {
      sdk.logger.error('Could not share response', { error })

      setFlowErrorFromError({
        reason: shareErrorMessage,
        error,
        responseMessage: shareErrorMessage,
      })
      return false
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

        setFlowErrorFromError({
          reason: t(commonMessages.presentationCouldNotBeShared),
          error,
          responseMessage: t(commonMessages.presentationCouldNotBeShared),
        })
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

    try {
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
        await authorizeWalletFlow({
          mode: authorizationMode,
          pin,
        })

        if (shouldUseCloudHsm) {
          await setupWalletServiceProvider(paradym.paradym)
        }

        const didShare = await onShareResponse(paradym.paradym)
        if (didShare) onAuthorized?.()
        return
      }

      throw new Error(`Invalid state. Received: '${paradym.state}'`)
    } catch (error) {
      if (isWalletAuthPromptError(error)) {
        onAuthorizationError?.()
        return
      }

      setFlowErrorFromError({
        reason: t(commonMessages.presentationCouldNotBeShared),
        error,
        responseMessage: t(commonMessages.presentationCouldNotBeShared),
      })
    } finally {
      clearWalletFlowAuthorization()
      setIsProcessing(false)
    }
  }

  return (
    <WalletFlowShell
      surface="overlay"
      title={t({
        id: 'dcApi.share.title',
        message: 'Share from wallet',
        comment: 'Title for the Digital Credentials API wallet auth prompt',
      })}
      subtitle={requestOriginLabel}
      logo={requestOriginLogo}
      logoFallback={requestOriginLabel}
      onCancel={() => rejectRequest(flowError?.responseMessage ?? 'Information request declined')}
    >
      {flowError ? (
        <WalletFlowErrorContent message={flowError.message} onClose={() => rejectRequest(flowError.responseMessage)} />
      ) : (
        <WalletFlowAuthPrompt authMode={authorizationMode} onSubmit={onAuthorize} isLoading={isAuthorizing} />
      )}
    </WalletFlowShell>
  )
}
