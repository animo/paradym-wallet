import { sendErrorResponse } from '@animo-id/expo-digital-credentials-api'
import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { setupWalletServiceProvider, setWalletServiceProviderPin } from '@easypid/crypto/WalletServiceProviderClient'
import {
  type TransactionData,
  TransactionDataWidget,
  useTransactionDataConsentLabels,
} from '@easypid/features/flow/TransactionDataRegistry'
import { getOriginLabel, useOriginLogo } from '@easypid/features/flow/useOriginLogo'
import { WalletFlowActionButton, WalletFlowErrorContent, WalletFlowShell } from '@easypid/features/flow/WalletFlowShell'
import { useShouldUseCloudHsm } from '@easypid/features/onboarding/useShouldUseCloudHsm'
import { useDevelopmentMode } from '@easypid/hooks'
import type { SubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import {
  authorizeWalletFlow,
  clearWalletFlowAuthorization,
  getWalletFlowAuthenticationMethods,
  isWalletAuthPromptError,
} from '@easypid/utils/authorizeWalletFlow'
import { useLingui } from '@lingui/react/macro'
import { Provider } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Paragraph, Stack, YStack } from '@package/ui'
import {
  type DigitalCredentialsRequest,
  getDcApiDisplayedTransactionDataIndexes,
  getOpenId4VpTransactionDataForConsent,
  ParadymWalletSdk,
  useParadym,
} from '@paradym/wallet-sdk'
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

type ResolvedDcApiRequest = Awaited<ReturnType<ParadymWalletSdk['dcApi']['resolveRequest']>>
type PendingTransactionDataConsent = {
  sdk: ParadymWalletSdk
  resolvedRequest: ResolvedDcApiRequest
  transactionData: TransactionData[]
  authenticationMethods?: string[]
}
type ShareResponseResult = 'sent' | 'requires-consent' | 'failed'

function TransactionDataConsentContent({
  transactionData,
  isSubmitting,
  onAccept,
  onDecline,
}: {
  transactionData: TransactionData[]
  isSubmitting: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  const { t } = useLingui()
  const firstTransaction = transactionData[0]
  const actionLabels = useTransactionDataConsentLabels(firstTransaction)

  return (
    <YStack gap="$4">
      <Paragraph>
        {t({
          id: 'dcApi.transactionDataConsent.description',
          message: 'Review and confirm the transaction data before sharing.',
          comment: 'Description shown when DC API did not display transaction data in the system selector',
        })}
      </Paragraph>

      {transactionData.map((entry, index) => (
        <TransactionDataWidget key={`${entry.type}-${index}`} transactionData={entry} />
      ))}

      <WalletFlowActionButton isLoading={isSubmitting} onPress={onAccept}>
        {actionLabels.acceptLabel}
      </WalletFlowActionButton>
      <Button.Text scaleOnPress disabled={isSubmitting} onPress={onDecline}>
        {actionLabels.declineLabel}
      </Button.Text>
    </YStack>
  )
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
  const [pendingTransactionDataConsent, setPendingTransactionDataConsent] = useState<PendingTransactionDataConsent>()
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
  const transactionDataConsentLabels = useTransactionDataConsentLabels(
    pendingTransactionDataConsent?.transactionData[0]
  )
  const title = t({
    id: 'dcApi.share.title',
    message: 'Share from wallet',
    comment: 'Title for the Digital Credentials API wallet auth prompt',
  })
  const isAuthorizing =
    isProcessing || paradym.state === 'acquired-wallet-key' || (paradym.state === 'locked' && paradym.isUnlocking)

  const clearFlowAuthorization = (options?: {
    clearWalletServiceProviderPin?: boolean
    clearCloudHsmPin?: boolean
  }) => {
    const { clearWalletServiceProviderPin = true, clearCloudHsmPin = true } = options ?? {}

    if (clearCloudHsmPin) cloudHsmPinRef.current = undefined
    onAuthorizationErrorRef.current = undefined
    if (clearWalletServiceProviderPin) clearWalletFlowAuthorization()
  }

  const rejectRequest = (errorMessage: string) => {
    clearFlowAuthorization()
    sendErrorResponse({ errorMessage })
  }

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

  const sendResolvedResponse = async (
    sdk: ParadymWalletSdk,
    resolvedRequest: ResolvedDcApiRequest,
    authenticationMethods?: string[]
  ) => {
    await sdk.dcApi.sendResponse({
      authenticationMethods,
      dcRequest: request,
      resolvedRequest,
    })
  }

  const onShareResponse = async (
    sdk: ParadymWalletSdk,
    authenticationMethods?: string[]
  ): Promise<ShareResponseResult> => {
    const resolveErrorMessage = t(commonMessages.presentationInformationCouldNotBeExtracted)
    const shareErrorMessage = t(commonMessages.presentationCouldNotBeShared)
    let resolvedRequest: ResolvedDcApiRequest

    try {
      resolvedRequest = await sdk.dcApi.resolveRequest({ request })
      const transactionData = getOpenId4VpTransactionDataForConsent({
        resolvedRequest,
        displayedTransactionDataIndexes: getDcApiDisplayedTransactionDataIndexes(request),
      })

      if (transactionData.length > 0) {
        setPendingTransactionDataConsent({ authenticationMethods, sdk, resolvedRequest, transactionData })
        return 'requires-consent'
      }
    } catch (error) {
      sdk.logger.error('Error getting credentials for dc api request', {
        error,
      })

      setFlowErrorFromError({
        reason: resolveErrorMessage,
        error,
        responseMessage: resolveErrorMessage,
      })
      return 'failed'
    }

    try {
      await sendResolvedResponse(sdk, resolvedRequest, authenticationMethods)

      return 'sent'
    } catch (error) {
      sdk.logger.error('Could not share response', { error })

      setFlowErrorFromError({
        reason: shareErrorMessage,
        error,
        responseMessage: shareErrorMessage,
      })
      return 'failed'
    }
  }

  useEffect(() => {
    if (isProcessing || paradym.state !== 'acquired-wallet-key') return

    setIsProcessing(true)
    let keepWalletFlowAuthorization = false
    paradym
      .unlock()
      .then(async (sdk) => {
        if (shouldUseCloudHsm) {
          if (!cloudHsmPinRef.current) throw new Error('PIN is required to use Cloud HSM')
          await setWalletServiceProviderPin(cloudHsmPinRef.current, false)
        }

        await setupWalletServiceProvider(sdk)
        keepWalletFlowAuthorization =
          (await onShareResponse(sdk, getWalletFlowAuthenticationMethods(paradym.unlockMethod))) === 'requires-consent'
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
        clearFlowAuthorization({ clearWalletServiceProviderPin: !keepWalletFlowAuthorization })
        setIsProcessing(false)
      })
  }, [isProcessing, onShareResponse, paradym, shouldUseCloudHsm])

  const onAuthorize = async ({ pin, onAuthorized, onAuthorizationError }: OnWalletAuthSubmitProps = {}) => {
    onAuthorizationErrorRef.current = onAuthorizationError
    let keepWalletFlowAuthorization = false
    let keepCloudHsmPin = false

    try {
      if (paradym.state === 'initializing') {
        return
      }

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

        keepCloudHsmPin = shouldUseCloudHsm
        onAuthorized?.()
        return
      }

      if (paradym.state === 'unlocked') {
        setIsProcessing(true)
        const authorizationMethod = await authorizeWalletFlow({
          mode: authorizationMode,
          pin,
        })

        if (shouldUseCloudHsm) {
          await setupWalletServiceProvider(paradym.paradym)
        }

        const didShare = await onShareResponse(paradym.paradym, getWalletFlowAuthenticationMethods(authorizationMethod))
        keepWalletFlowAuthorization = didShare === 'requires-consent'
        if (didShare === 'sent') onAuthorized?.()
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
      clearFlowAuthorization({
        clearWalletServiceProviderPin: !keepWalletFlowAuthorization,
        clearCloudHsmPin: !keepCloudHsmPin,
      })
      setIsProcessing(false)
    }
  }

  const onConfirmTransactionData = async () => {
    if (!pendingTransactionDataConsent || isProcessing) return

    setIsProcessing(true)
    try {
      await sendResolvedResponse(
        pendingTransactionDataConsent.sdk,
        pendingTransactionDataConsent.resolvedRequest,
        pendingTransactionDataConsent.authenticationMethods
      )
    } catch (error) {
      pendingTransactionDataConsent.sdk.logger.error('Could not share response', { error })

      setFlowErrorFromError({
        reason: t(commonMessages.presentationCouldNotBeShared),
        error,
        responseMessage: t(commonMessages.presentationCouldNotBeShared),
      })
    } finally {
      setPendingTransactionDataConsent(undefined)
      clearFlowAuthorization()
      setIsProcessing(false)
    }
  }

  if (paradym.state === 'initializing') {
    return (
      <WalletFlowShell
        surface="overlay"
        title={title}
        subtitle={requestOriginLabel}
        logo={requestOriginLogo}
        logoFallback={requestOriginLabel}
        isLoading
        onCancel={() => rejectRequest('Information request declined')}
      >
        <Stack />
      </WalletFlowShell>
    )
  }

  if (paradym.state === 'not-configured') {
    const errorMessage = t(commonMessages.presentationCouldNotBeShared)

    return (
      <WalletFlowShell
        surface="overlay"
        title={title}
        subtitle={requestOriginLabel}
        logo={requestOriginLogo}
        logoFallback={requestOriginLabel}
        onCancel={() => rejectRequest(errorMessage)}
      >
        <WalletFlowErrorContent message={errorMessage} onClose={() => rejectRequest(errorMessage)} />
      </WalletFlowShell>
    )
  }

  if (pendingTransactionDataConsent) {
    const declineMessage = 'Information request declined'

    return (
      <WalletFlowShell
        surface="overlay"
        title={transactionDataConsentLabels.title}
        subtitle={requestOriginLabel}
        logo={requestOriginLogo}
        logoFallback={requestOriginLabel}
        onCancel={() => rejectRequest(declineMessage)}
      >
        <TransactionDataConsentContent
          transactionData={pendingTransactionDataConsent.transactionData}
          isSubmitting={isProcessing}
          onAccept={() => void onConfirmTransactionData()}
          onDecline={() => rejectRequest(declineMessage)}
        />
      </WalletFlowShell>
    )
  }

  return (
    <WalletFlowShell
      surface="overlay"
      title={title}
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
