import type { DigitalCredentialsRequest } from '@animo-id/expo-digital-credentials-api'
import { initializeAppAgent } from '@easypid/agent'
import { useLingui } from '@lingui/react/macro'
import {
  AgentProvider,
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type EitherAgent,
  type FormattedTransactionData,
  getFormattedTransactionData,
} from '@package/agent'
import { resolveRequestForDcApi, sendErrorResponseForDcApi, sendResponseForDcApi } from '@package/agent/openid4vc/dcApi'
import { PinDotsInput, type PinDotsInputRef, Provider, type SlideStep, SlideWizard } from '@package/app'
import { secureWalletKey } from '@package/secure-store/secureUnlock'
import { commonMessages } from '@package/translations'
import { Heading, HeroIcons, IconContainer, Paragraph, Spinner, Stack, YStack } from '@package/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import tamaguiConfig from '../../../tamagui.config'
import { InvalidPinError } from '../../crypto/error'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { useStoredLocale } from '../../hooks/useStoredLocale'
import { SigningSlide } from './slides/SigningSlide'
import { getAdditionalPayload } from './slides/Ts12BaseSlide'
import { Ts12PaymentSlide } from './slides/Ts12PaymentSlide'
import { Ts12TransactionSlide } from './slides/Ts12TransactionSlide'

type DcApiSharingScreenProps = {
  request: DigitalCredentialsRequest
}

type TransactionSelection = {
  credentialId?: string
  additionalPayload?: object
}

const stripCredentialPrefix = (credentialId: string) =>
  credentialId.replace(/^(sd-jwt-vc-|mdoc-|w3c-credential-|w3c-v2-credential-)/, '')

export function DcApiSharingScreen({ request }: DcApiSharingScreenProps) {
  const [storedLocale] = useStoredLocale()

  return (
    <SafeAreaProvider>
      <Provider disableInjectCSS defaultTheme="light" config={tamaguiConfig} customLocale={storedLocale}>
        <Stack flex-1 justifyContent="flex-end">
          <DcApiSharingScreenWithContext request={request} />
        </Stack>
      </Provider>
    </SafeAreaProvider>
  )
}

export function DcApiSharingScreenWithContext({ request }: DcApiSharingScreenProps) {
  const [agent, setAgent] = useState<EitherAgent>()
  const [resolvedRequest, setResolvedRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [selectedTransactionData, setSelectedTransactionData] = useState<TransactionSelection[]>([])
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [unlockPin, setUnlockPin] = useState<string>()
  const pinRef = useRef<PinDotsInputRef>(null)
  const hasSharedRef = useRef(false)
  const insets = useSafeAreaInsets()
  const { t } = useLingui()

  const shouldUsePin = useShouldUsePinForSubmission(resolvedRequest?.formattedSubmission)

  const onUnlock = useCallback(
    async (pin: string) => {
      setIsUnlocking(true)

      const unlockedAgent = await secureWalletKey
        .getWalletKeyUsingPin(pin, secureWalletKey.getWalletKeyVersion())
        .then(async (walletKey) =>
          initializeAppAgent({
            walletKey,
            walletKeyVersion: secureWalletKey.getWalletKeyVersion(),
          })
        )
        .catch((e) => {
          if (e instanceof InvalidPinError) {
            pinRef.current?.clear()
            pinRef.current?.shake()
            return undefined
          }

          sendErrorResponseForDcApi('Error initializing wallet')
          return undefined
        })

      setIsUnlocking(false)
      if (!unlockedAgent) return
      setUnlockPin(pin)
      setAgent(unlockedAgent)
    },
    [setAgent]
  )

  useEffect(() => {
    if (!agent || resolvedRequest) return

    setIsResolving(true)
    resolveRequestForDcApi({ agent, request })
      .then(async (resolved) => {
        const formatted = await getFormattedTransactionData(resolved)
        setResolvedRequest(resolved)
        setFormattedTransactionData(formatted)
        if (formatted) {
          setSelectedTransactionData(formatted.map(() => ({})))
        }
      })
      .catch((error) => {
        agent.config.logger.error('Error getting credentials for dc api request', {
          error,
        })
        sendErrorResponseForDcApi('Presentation information could not be extracted')
        setResolvedRequest(undefined)
        setFormattedTransactionData(undefined)
        setSelectedTransactionData([])
      })
      .finally(() => {
        setIsResolving(false)
      })
  }, [agent, request, resolvedRequest])

  const onTransactionDataSelect = useCallback((index: number, data: TransactionSelection) => {
    setSelectedTransactionData((prev) => {
      if (prev[index]?.credentialId === data.credentialId) return prev
      const next = [...prev]
      next[index] = data
      return next
    })
  }, [])

  const onDecline = useCallback(() => {
    sendErrorResponseForDcApi(t(commonMessages.informationRequestDeclined))
  }, [t])

  const onProofAccept = useCallback(async () => {
    if (!agent || !resolvedRequest) return

    if (shouldUsePin) {
      if (!unlockPin) {
        return
      }

      try {
        await setWalletServiceProviderPin(unlockPin.split('').map(Number))
      } catch (error) {
        if (error instanceof InvalidPinError) {
          pinRef.current?.clear()
          pinRef.current?.shake()
          setAgent(undefined)
          setResolvedRequest(undefined)
          setFormattedTransactionData(undefined)
          setSelectedTransactionData([])
          setUnlockPin(undefined)
          hasSharedRef.current = false
          return
        }

        sendErrorResponseForDcApi('PIN authentication failed')
        return
      }
    }

    try {
      const selectedCredentials = Object.fromEntries(
        resolvedRequest.formattedSubmission.entries
          .filter((entry): entry is typeof entry & { isSatisfied: true } => entry.isSatisfied)
          .map((entry) => [entry.inputDescriptorId, entry.credentials[0].credential.record.id])
      )

      let acceptTransactionData: Array<{ credentialId: string; additionalPayload?: object }> | undefined

      if (formattedTransactionData && formattedTransactionData.length > 0) {
        const responseMode = resolvedRequest.authorizationRequest.response_mode
        const transactionSelections = selectedTransactionData.map((entry) => ({ ...entry }))

        formattedTransactionData.forEach((entry, index) => {
          let selected = transactionSelections[index]?.credentialId
          if (!selected) {
            const firstCredential = entry.formattedSubmissions
              .find((s) => s.isSatisfied && s.credentials.length > 0)
              ?.credentials[0]?.credential?.id

            if (firstCredential) {
              selected = firstCredential
              transactionSelections[index] = {
                credentialId: firstCredential,
                additionalPayload:
                  entry.type === 'qes_authorization'
                    ? undefined
                    : getAdditionalPayload(responseMode),
              }
            }
          }

          if (!selected) return

          if (
            entry.type !== 'qes_authorization' &&
            transactionSelections[index] &&
            !transactionSelections[index]?.additionalPayload
          ) {
            transactionSelections[index] = {
              credentialId: selected,
              additionalPayload: getAdditionalPayload(responseMode),
            }
          }

          const submission = entry.formattedSubmissions.find(
            (s) => s.isSatisfied && s.credentials.some((c) => c.credential.id === selected)
          )

          if (!submission) {
            throw new Error('Selected credential ids should always have a submission')
          }

          const selectedRecordId = stripCredentialPrefix(selected)
          if (
            Object.hasOwn(selectedCredentials, submission.inputDescriptorId) &&
            selectedCredentials[submission.inputDescriptorId] !== selectedRecordId
          ) {
            throw new Error('Cannot select distinct credential ids for inputDescriptor ids')
          }

          selectedCredentials[submission.inputDescriptorId] = selectedRecordId
          transactionSelections[index].credentialId = submission.inputDescriptorId
        })

        if (transactionSelections.some((entry) => typeof entry.credentialId !== 'string')) {
          throw new Error('No credentials selected for transaction data')
        }

        acceptTransactionData = transactionSelections as Array<{ credentialId: string; additionalPayload?: object }>
      }

      await sendResponseForDcApi({
        agent,
        dcRequest: request,
        resolvedRequest,
        acceptTransactionData,
        selectedCredentials,
      })
    } catch (error) {
      agent.config.logger.error('Could not share response', { error })

      if (error instanceof BiometricAuthenticationCancelledError) {
        sendErrorResponseForDcApi('Biometric authentication cancelled')
        return
      }

      sendErrorResponseForDcApi('Unable to share credentials')
    } finally {
      // no-op: sending response should close the flow
    }
  }, [
    agent,
    formattedTransactionData,
    request,
    resolvedRequest,
    selectedTransactionData,
    shouldUsePin,
    unlockPin,
  ])

  const transactionSlides: SlideStep[] = (formattedTransactionData ?? []).flatMap((entry, index) => {
    const progress = ((index + 1) / ((formattedTransactionData?.length ?? 0) + 1)) * 100

    if (entry.type === 'qes_authorization') {
      return [
        {
          step: `signing-${index}`,
          progress,
          screen: (
            <SigningSlide
              key={`signing-${index}`}
              qtsp={entry.qtsp}
              documentNames={entry.documentNames}
              onCredentialSelect={(credentialId) =>
                onTransactionDataSelect(index, { credentialId, additionalPayload: undefined })
              }
              selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
              possibleCredentialIds={entry.formattedSubmissions.flatMap((s) =>
                s.isSatisfied ? s.credentials.map((c) => c.credential.id) : []
              )}
            />
          ),
        },
      ]
    }

    if (entry.type === 'urn:eudi:sca:payment:1') {
      return [
        {
          step: `ts12-payment-${index}`,
          progress,
          screen: (
            <Ts12PaymentSlide
              key={`ts12-payment-${index}`}
              entry={entry}
              onCredentialSelect={(credentialId, additionalPayload) =>
                onTransactionDataSelect(index, { credentialId, additionalPayload })
              }
              selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
              responseMode={resolvedRequest?.authorizationRequest.response_mode}
            />
          ),
        },
      ]
    }

    return [
      {
        step: `ts12-${index}`,
        progress,
        screen: (
          <Ts12TransactionSlide
            key={`ts12-${index}`}
            entry={entry}
            onCredentialSelect={(credentialId, additionalPayload) =>
              onTransactionDataSelect(index, { credentialId, additionalPayload })
            }
            selectedCredentialId={selectedTransactionData?.[index]?.credentialId}
            responseMode={resolvedRequest?.authorizationRequest.response_mode}
          />
        ),
      },
    ]
  })

  useEffect(() => {
    if (!agent || !resolvedRequest || hasSharedRef.current) return
    if (formattedTransactionData && formattedTransactionData.length > 0) return
    hasSharedRef.current = true
    void onProofAccept()
  }, [agent, formattedTransactionData, onProofAccept, resolvedRequest])

  const SendingSlide = () => {
    const startedRef = useRef(false)

    useEffect(() => {
      if (startedRef.current) return
      startedRef.current = true
      void onProofAccept()
    }, [onProofAccept])

    return (
      <YStack fg={1} jc="center" ai="center" gap="$4">
        <Spinner />
        <Paragraph>
          {t({
            id: 'sharing.inProgress',
            message: 'Sharing information',
            comment: 'Shown while sharing data for the digital credentials API flow',
          })}
        </Paragraph>
      </YStack>
    )
  }

  if (!agent) {
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
          <Stack flexDirection="row" jc="space-between" ai="center">
            <Heading>{t(commonMessages.enterPinToShareData)}</Heading>
            <IconContainer aria-label="Cancel" icon={<HeroIcons.X />} onPress={onDecline} />
          </Stack>
          <Paragraph variant="annotation">{request.origin}</Paragraph>
        </YStack>

        <Stack pt="$5">
          <PinDotsInput
            onPinComplete={onUnlock}
            isLoading={isUnlocking}
            pinLength={6}
            ref={pinRef}
            useNativeKeyboard={false}
          />
        </Stack>
      </YStack>
    )
  }

  if (isResolving || !resolvedRequest) {
    return (
      <YStack fg={1} jc="center" ai="center" gap="$4">
        <Spinner />
        <Paragraph>
          {t({
            id: 'loadingRequestSlide.description',
            message: 'Fetching information',
            comment: 'Shown while waiting for data to be received from backend',
          })}
        </Paragraph>
      </YStack>
    )
  }

  if (!formattedTransactionData || formattedTransactionData.length === 0) {
    return (
      <YStack fg={1} jc="center" ai="center" gap="$4">
        <Spinner />
        <Paragraph>
          {t({
            id: 'sharing.inProgress',
            message: 'Sharing information',
            comment: 'Shown while sharing data for the digital credentials API flow',
          })}
        </Paragraph>
      </YStack>
    )
  }

  return (
    <AgentProvider agent={agent}>
      <SlideWizard
        steps={[
          ...transactionSlides,
          {
            step: 'send',
            progress: 100,
            screen: <SendingSlide />,
          },
        ]}
        onCancel={onDecline}
      />
    </AgentProvider>
  )
}
