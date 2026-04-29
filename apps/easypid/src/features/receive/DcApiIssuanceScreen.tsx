import {
  type DigitalCredentialsCreateRequest,
  sendCreateErrorResponse,
  sendCreateResponse,
} from '@animo-id/expo-digital-credentials-api'
import { paradymWalletSdkOptions } from '@easypid/config/paradym'
import { useLingui } from '@lingui/react/macro'
import { PinDotsInput, type PinDotsInputRef, Provider } from '@package/app'
import { commonMessages } from '@package/translations'
import { FlexPage, Heading, HeroIcons, IconContainer, YStack } from '@package/ui'
import {
  activityStorage,
  deferredCredentialStorage,
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletSdk,
  useParadym,
} from '@paradym/wallet-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { FunkeCredentialNotificationScreen } from './FunkeOpenIdCredentialNotificationScreen'

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
    <SafeAreaProvider>
      <Provider disableInjectCSS defaultTheme="light" config={tamaguiConfig} customLocale={storedLocale}>
        <ParadymWalletSdk.UnlockProvider configuration={paradymWalletSdkOptions}>
          <DcApiIssuanceScreenWithContext offerUri={offerUri} request={request} />
        </ParadymWalletSdk.UnlockProvider>
      </Provider>
    </SafeAreaProvider>
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
  const pinInputRef = useRef<PinDotsInputRef>(null)
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
    if (!offerUri) sendCreateErrorResponseOnce('Invalid credential offer')
  }, [offerUri, sendCreateErrorResponseOnce])

  useEffect(() => {
    if (paradym.state === 'not-configured') sendCreateErrorResponseOnce('Wallet is not configured')
  }, [paradym.state, sendCreateErrorResponseOnce])

  useEffect(() => {
    if (isInitializingAgent || paradym.state !== 'acquired-wallet-key') return

    setIsInitializingAgent(true)
    paradym
      .unlock()
      .catch((error) => {
        if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
          pinInputRef.current?.clear()
          pinInputRef.current?.shake()
          return
        }

        sendCreateErrorResponseOnce('Error initializing wallet')
      })
      .finally(() => setIsInitializingAgent(false))
  }, [paradym, isInitializingAgent, sendCreateErrorResponseOnce])

  if (!offerUri) return null

  if (paradym.state === 'not-configured') {
    return null
  }

  if (paradym.state === 'unlocked') {
    return (
      <ParadymWalletSdk.AppProvider recordIds={jsonRecordIds}>
        <FunkeCredentialNotificationScreen
          uri={offerUri}
          onCancel={(reason) =>
            sendCreateErrorResponseOnce(reason ?? t(commonMessages.errorWhileRetrievingCredentials))
          }
          onComplete={sendCreateResponseOnce}
        />
      </ParadymWalletSdk.AppProvider>
    )
  }

  if (paradym.state === 'locked' || paradym.state === 'acquired-wallet-key') {
    const isLoading = (paradym.state === 'locked' && paradym.isUnlocking) || isInitializingAgent

    return (
      <FlexPage flex-1 alignItems="center">
        <YStack fg={1} gap="$6">
          <YStack flex-1 alignItems="center" justifyContent="flex-end" gap="$4">
            <IconContainer h="$4" w="$4" ai="center" jc="center" icon={<HeroIcons.LockClosedFilled />} />
            <Heading heading="h2" fontWeight="$semiBold">
              {t(commonMessages.enterPin)}
            </Heading>
          </YStack>
          <PinDotsInput
            isLoading={isLoading}
            ref={pinInputRef}
            pinLength={6}
            onPinComplete={(pin) => {
              if (paradym.state === 'locked') void paradym.unlockUsingPin(pin)
            }}
            useNativeKeyboard={false}
          />
        </YStack>
      </FlexPage>
    )
  }

  return null
}
