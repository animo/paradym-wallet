import {
  type DigitalCredentialsCreateRequest,
  sendCreateErrorResponse,
  sendCreateResponse,
} from '@animo-id/expo-digital-credentials-api'
import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { WalletFlowErrorContent, WalletFlowShell } from '@easypid/features/flow/WalletFlowShell'
import { useLingui } from '@lingui/react/macro'
import { Provider } from '@package/app'
import { commonMessages } from '@package/translations'
import { Stack, YStack } from '@package/ui'
import { activityStorage, deferredCredentialStorage, ParadymWalletSdk, useParadym } from '@paradym/wallet-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { FunkeCredentialNotificationFlow } from './FunkeOpenIdCredentialNotificationScreen'

type DcApiIssuanceScreenProps = {
  request: DigitalCredentialsCreateRequest
}

const jsonRecordIds = [activityStorage.recordId, deferredCredentialStorage.recordId]

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const getCredentialOfferRequestData = (request: DigitalCredentialsCreateRequest) => {
  const requestPayload = request.request as
    | { data?: unknown }
    | { requests?: Array<{ data?: unknown }> }
    | { providers?: Array<{ request?: unknown }> }
    | undefined

  if (!requestPayload) return undefined
  if ('requests' in requestPayload && Array.isArray(requestPayload.requests)) return requestPayload.requests[0]?.data
  if ('providers' in requestPayload && Array.isArray(requestPayload.providers)) {
    return requestPayload.providers[0]?.request
  }
  if ('data' in requestPayload) return requestPayload.data

  return undefined
}

const getCredentialOfferUri = (request: DigitalCredentialsCreateRequest) => {
  const data = getCredentialOfferRequestData(request)
  if (!data) return null

  if (typeof data === 'string') {
    const trimmed = data.trim()
    const parsed = trimmed.startsWith('{') || trimmed.startsWith('[') ? tryParseJson(trimmed) : undefined
    if (!parsed) return trimmed

    return getCredentialOfferUri({
      ...request,
      request: { protocol: request.request?.protocol ?? 'openid4vci', data: parsed },
    })
  }

  if (typeof data !== 'object') return null

  const payload = data as Record<string, unknown>
  const credentialOfferUri =
    (payload.credential_offer_uri as string | undefined) ??
    (payload.credentialOfferUri as string | undefined) ??
    (payload.offer_uri as string | undefined) ??
    (payload.offerUri as string | undefined)

  if (credentialOfferUri) {
    return `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(credentialOfferUri)}`
  }

  const credentialOffer =
    (payload.credential_offer as object | undefined) ??
    (payload.credentialOffer as object | undefined) ??
    (payload.offer as object | undefined)

  if (credentialOffer) {
    return `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOffer))}`
  }

  if (payload.credential_issuer || payload.issuer) {
    return `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(payload))}`
  }

  return null
}

export function DcApiIssuanceScreen({ request }: DcApiIssuanceScreenProps) {
  const [storedLocale] = useStoredLocale()
  const offerUri = getCredentialOfferUri(request)

  return (
    <Provider config={tamaguiConfig} customLocale={storedLocale} rootBackgroundColor="transparent">
      <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
        <Stack flex-1 justifyContent="flex-end" backgroundColor="transparent">
          <DcApiIssuanceScreenWithContext offerUri={offerUri} request={request} />
        </Stack>
      </ParadymWalletSdk.UnlockProvider>
    </Provider>
  )
}

function DcApiIssuanceScreenWithContext({
  offerUri,
  request,
}: {
  offerUri: string | null
  request: DigitalCredentialsCreateRequest
}) {
  const paradym = useParadym()
  const hasSentResponse = useRef(false)
  const [isInitializingAgent, setIsInitializingAgent] = useState(false)
  const { t } = useLingui()

  const sendCreateErrorResponseOnce = useCallback((message: string) => {
    if (hasSentResponse.current) return
    hasSentResponse.current = true
    sendCreateErrorResponse({ errorMessage: message })
  }, [])

  const sendCreateResponseOnce = useCallback(
    (newEntryId?: string) => {
      if (hasSentResponse.current) return
      hasSentResponse.current = true
      sendCreateResponse({
        response: JSON.stringify({ protocol: 'openid4vci', data: {} }),
        type: request.type,
        newEntryId,
      })
    },
    [request.type]
  )

  useEffect(() => {
    if (isInitializingAgent || paradym.state !== 'acquired-wallet-key') return

    setIsInitializingAgent(true)
    paradym
      .unlock()
      .catch(() => sendCreateErrorResponseOnce('Error initializing wallet'))
      .finally(() => setIsInitializingAgent(false))
  }, [paradym, isInitializingAgent, sendCreateErrorResponseOnce])

  const onUnlock = async ({ pin, onAuthorizationError, onAuthorized }: OnWalletAuthSubmitProps = {}) => {
    setIsInitializingAgent(true)

    try {
      if (paradym.state === 'locked') {
        if (pin) {
          await paradym.unlockUsingPin(pin)
        } else {
          await paradym.tryUnlockingUsingBiometrics()
        }
      } else if (paradym.state === 'acquired-wallet-key') {
        await paradym.unlock()
      }

      onAuthorized?.()
    } catch {
      onAuthorizationError?.()
    } finally {
      setIsInitializingAgent(false)
    }
  }

  const renderError = (message: string) => (
    <WalletFlowShell surface="overlay" title={t(commonMessages.somethingWentWrong)}>
      <WalletFlowErrorContent message={message} onClose={() => sendCreateErrorResponseOnce(message)} />
    </WalletFlowShell>
  )

  if (!offerUri) return renderError('Invalid credential offer')

  if (paradym.state === 'not-configured') {
    return renderError('Wallet is not configured')
  }

  if (paradym.state === 'unlocked') {
    return (
      <ParadymWalletSdk.AppProvider recordIds={jsonRecordIds}>
        <FunkeCredentialNotificationFlow
          source="external"
          routeParams={{ uri: offerUri }}
          onExit={(reason) => sendCreateErrorResponseOnce(reason ?? t(commonMessages.errorWhileRetrievingCredentials))}
          onComplete={sendCreateResponseOnce}
        />
      </ParadymWalletSdk.AppProvider>
    )
  }

  if (paradym.state === 'locked' || paradym.state === 'acquired-wallet-key') {
    const isLoading = (paradym.state === 'locked' && paradym.isUnlocking) || isInitializingAgent

    return (
      <WalletFlowShell
        surface="overlay"
        title={t({
          id: 'overlay.unlockTitle',
          message: 'Unlock wallet',
          comment: 'Title shown when an external overlay needs wallet unlock',
        })}
        onCancel={() => sendCreateErrorResponseOnce(t(commonMessages.authorizationCancelled))}
      >
        <WalletFlowAuthPrompt authMode="pin-or-biometrics" onSubmit={onUnlock} isLoading={isLoading} />
      </WalletFlowShell>
    )
  }

  return (
    <WalletFlowShell
      surface="overlay"
      title={t({
        id: 'overlay.loadingTitle',
        message: 'Preparing request',
        comment: 'Title shown while the transparent overlay initializes the wallet',
      })}
      isLoading
    >
      <YStack />
    </WalletFlowShell>
  )
}
