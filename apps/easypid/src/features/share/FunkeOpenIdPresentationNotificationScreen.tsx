import { useAppAgent } from '@easypid/agent'
import { InvalidPinError } from '@easypid/crypto/error'
import { useDevelopmentMode, useOverAskingAi } from '@easypid/hooks'
import { useLingui } from '@lingui/react/macro'
import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type FormattedSubmissionEntrySatisfied,
  type FormattedTransactionData,
  getCredentialsForProofRequest,
  getDisclosedAttributeNamesForDisplay,
  getFormattedTransactionData,
  storeSharedActivityForCredentialsForRequest,
} from '@package/agent'
import { shareProof } from '@package/agent/invitation/shareProof'
import { usePushToWallet } from '@package/app/hooks/usePushToWallet'
import { commonMessages } from '@package/translations'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { trustedX509Entities } from '../../constants'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { onPinSubmitProps } from './slides/PinSlide'

type Query = { uri: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const { t } = useLingui()
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const [errorReason, setErrorReason] = useState<string>()

  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [selectedTransactionData, setSelectedTransactionData] = useState<
    {
      credentialId?: string
      additionalPayload?: object
    }[]
  >([])
  const [isSharing, setIsSharing] = useState(false)
  const shouldUsePin = useShouldUsePinForSubmission(credentialsForRequest?.formattedSubmission)

  const handleError = useCallback(({ reason, description }: { reason: string; description?: string }) => {
    setIsSharing(false)
    setErrorReason(description ? `${reason}\n${description}` : reason)
    return
  }, [])

  const reasonNoCredentials = t({
    id: 'presentation.noCredentialsSelected',
    message: 'No credentials selected',
    comment: 'Shown when the user tries to accept a proof but no credentials are loaded',
  })

  const reasonPinAuthFailed = t({
    id: 'presentation.pinAuthFailed',
    message: 'PIN authentication failed',
    comment: 'Shown when PIN is required but not provided',
  })

  const reasonAuthFailed = t({
    id: 'presentation.authFailed',
    message: 'Authentication failed',
    comment: 'Shown when authentication with PIN fails for other reasons',
  })

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      uri: params.uri,
      trustedX509Entities,
    })
      .then((r) => {
        setCredentialsForRequest(r)
        return r
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined

        handleError({
          reason: t(commonMessages.presentationInformationCouldNotBeExtracted),
          description: errorMessage,
        })

        agent.config.logger.error('Error getting credentials for request', {
          error,
        })
        return
      })
      .then(async (r) => {
        if (r) {
          const formatted = await getFormattedTransactionData(r)
          setFormattedTransactionData(formatted)
          if (formatted) {
            setSelectedTransactionData(formatted.map(() => ({})))
          }
        }
      })
      .catch((error) => {
        console.error(error)
        handleError({ reason: error.message })
      })
  }, [credentialsForRequest, params.uri, agent, isDevelopmentModeEnabled, handleError, t])

  const { checkForOverAsking, isProcessingOverAsking, overAskingResponse, stopOverAsking } = useOverAskingAi()

  useEffect(() => {
    if (!credentialsForRequest?.formattedSubmission || !credentialsForRequest?.formattedSubmission.areAllSatisfied) {
      return
    }

    if (isProcessingOverAsking || overAskingResponse) {
      // Already generating or already has result
      return
    }

    const submission = credentialsForRequest.formattedSubmission
    const requestedCards = submission.entries
      .filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
      .flatMap((entry) => entry.credentials)

    void checkForOverAsking({
      verifier: {
        name: credentialsForRequest.verifier.name ?? 'No name provided',
        domain: credentialsForRequest.verifier.hostName ?? 'No domain provided',
      },
      name: submission.name ?? 'No name provided',
      purpose: submission.purpose ?? 'No purpose provided',
      cards: requestedCards.map((credential) => ({
        name: credential.credential.display.name ?? 'Card name',
        subtitle: credential.credential.display.description ?? 'Card description',
        requestedAttributes: getDisclosedAttributeNamesForDisplay(credential),
      })),
    })
  }, [credentialsForRequest, checkForOverAsking, isProcessingOverAsking, overAskingResponse])

  const onProofAccept = useCallback(
    async ({ pin, onPinComplete, onPinError }: onPinSubmitProps = {}) => {
      stopOverAsking()
      if (!credentialsForRequest) return handleError({ reason: reasonNoCredentials })

      setIsSharing(true)

      if (shouldUsePin) {
        if (!pin) {
          setIsSharing(false)
          return handleError({ reason: reasonPinAuthFailed })
        }

        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          setIsSharing(false)
          if (e instanceof InvalidPinError) {
            onPinError?.()
            toast.show(t(commonMessages.invalidPinEntered), {
              customData: {
                preset: 'danger',
              },
            })
            return
          }

          return handleError({
            reason: reasonAuthFailed,
            description:
              e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
          })
        }
      }

      try {
        // FIXME: Hacky hacks
        const selectedCredentials: Record<string, string> = {}
        if (formattedTransactionData && selectedTransactionData.length > 0) {
          formattedTransactionData.forEach((entry, index) => {
            const selected = selectedTransactionData[index]?.credentialId
            if (!selected) return

            // Find which input descriptor this credential belongs to
            const submission = entry.formattedSubmissions.find(
              (s) => s.isSatisfied && s.credentials.some((c) => c.credential.id === selected)
            )

            if (submission) {
              const trueSelectedId = selected?.replace('sd-jwt-vc-', '')
              if (
                Object.hasOwn(selectedCredentials, submission.inputDescriptorId) &&
                selectedCredentials[submission.inputDescriptorId] !== trueSelectedId
              )
                throw Error(`Cannot select distinct credential ids for inputDescriptor ids`)
              selectedCredentials[submission.inputDescriptorId] = trueSelectedId
              selectedTransactionData[index].credentialId = submission.inputDescriptorId
            } else {
              throw Error(`Selected credential ids should always have a submission`)
            }
          })
        }

        await shareProof({
          agent,
          resolvedRequest: credentialsForRequest,
          selectedCredentials,
          acceptTransactionData: selectedTransactionData as ((typeof selectedTransactionData)[number] & {
            credentialId: string
          })[],
        })

        onPinComplete?.()
        await storeSharedActivityForCredentialsForRequest(
          agent,
          credentialsForRequest,
          'success',
          formattedTransactionData
        ).catch(console.error)
      } catch (error) {
        setIsSharing(false)
        if (error instanceof BiometricAuthenticationCancelledError) {
          return handleError({
            reason: t(commonMessages.biometricAuthenticationCancelled),
          })
        }

        if (credentialsForRequest) {
          await storeSharedActivityForCredentialsForRequest(
            agent,
            credentialsForRequest,
            'failed',
            formattedTransactionData
          ).catch(console.error)
        }

        agent.config.logger.error('Error accepting presentation', {
          error,
        })

        return handleError({
          reason: t(commonMessages.presentationCouldNotBeShared),
          description:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
        })
      }
    },
    [
      credentialsForRequest,
      agent,
      shouldUsePin,
      stopOverAsking,
      toast,
      isDevelopmentModeEnabled,
      handleError,
      formattedTransactionData,
      reasonNoCredentials,
      reasonPinAuthFailed,
      t,
      reasonAuthFailed,
      selectedTransactionData,
    ]
  )

  const onProofDecline = useCallback(async () => {
    stopOverAsking()
    if (credentialsForRequest) {
      await storeSharedActivityForCredentialsForRequest(
        agent,
        credentialsForRequest,
        credentialsForRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
        formattedTransactionData
      ).catch(console.error)
    }

    pushToWallet()
    toast.show(t(commonMessages.informationRequestDeclined), {
      customData: { preset: 'danger' },
    })
  }, [agent, credentialsForRequest, formattedTransactionData, pushToWallet, stopOverAsking, t, toast])

  const replace = useCallback(() => pushToWallet(), [pushToWallet])

  const onTransactionDataSelect = useCallback(
    (index: number, data: { credentialId: string; additionalPayload: object | undefined }) => {
      setSelectedTransactionData((prev) => {
        if (prev[index]?.credentialId === data.credentialId) return prev
        const next = [...prev]
        next[index] = data
        return next
      })
    },
    []
  )

  return (
    <FunkePresentationNotificationScreen
      key="presentation"
      usePin={shouldUsePin ?? false}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={credentialsForRequest?.formattedSubmission}
      isAccepting={isSharing}
      entityId={credentialsForRequest?.verifier.entityId}
      verifierName={credentialsForRequest?.verifier.name}
      logo={credentialsForRequest?.verifier.logo}
      trustedEntities={credentialsForRequest?.verifier.trustedEntities}
      trustMechanism={credentialsForRequest?.trustMechanism}
      onComplete={replace}
      onCancel={replace}
      overAskingResponse={overAskingResponse}
      transaction={formattedTransactionData}
      selectedTransactionData={selectedTransactionData}
      errorReason={errorReason}
      onTransactionDataSelect={onTransactionDataSelect}
      responseMode={credentialsForRequest?.authorizationRequest.response_mode}
    />
  )
}
