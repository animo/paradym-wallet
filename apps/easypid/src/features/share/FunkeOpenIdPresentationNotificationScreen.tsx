import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type FormattedSubmissionEntrySatisfied,
  type FormattedTransactionData,
  getCredentialsForProofRequest,
  getDisclosedAttributeNamesForDisplay,
  getFormattedTransactionData,
  shareProof,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { useAppAgent } from '@easypid/agent'
import { InvalidPinError } from '@easypid/crypto/error'
import { useOverAskingAi } from '@easypid/hooks'
import { useDevelopmentMode } from '@easypid/hooks'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { trustedX509Entities } from '../../constants'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { addSharedActivityForCredentialsForRequest, useActivities } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { onPinSubmitProps } from './slides/PinSlide'

type Query = { uri?: string; data?: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [formattedTransactionData, setFormattedTransactionData] = useState<FormattedTransactionData>()
  const [isSharing, setIsSharing] = useState(false)
  const { activities } = useActivities({
    filters: { entityId: credentialsForRequest?.verifier.entityId ?? 'NO MATCH' },
  })
  const lastInteractionDate = activities?.[0]?.date
  const shouldUsePin = useShouldUsePinForSubmission(credentialsForRequest?.formattedSubmission)

  const handleError = useCallback(
    ({ reason, description, redirect = true }: { reason: string; description?: string; redirect?: boolean }) => {
      setIsSharing(false)
      toast.show(reason, { message: description, customData: { preset: 'danger' } })
      if (redirect) pushToWallet()
      return
    },
    [toast, pushToWallet]
  )

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      encodedRequestData: params.data,
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

        handleError({ reason: 'Presentation information could not be extracted.', description: errorMessage })

        agent.config.logger.error('Error getting credentials for request', {
          error,
        })
        return
      })
      .then((r) => {
        if (r) setFormattedTransactionData(getFormattedTransactionData(r))
      })
      .catch((error) => {
        handleError({ reason: error.message })
      })
  }, [credentialsForRequest, params.data, params.uri, agent, isDevelopmentModeEnabled, handleError])

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
      if (!credentialsForRequest) return handleError({ reason: 'No credentials selected' })

      setIsSharing(true)

      if (shouldUsePin) {
        if (!pin) {
          setIsSharing(false)
          return handleError({ reason: 'PIN authentication failed' })
        }
        // TODO: maybe provide to shareProof method?
        try {
          await setWalletServiceProviderPin(pin.split('').map(Number))
        } catch (e) {
          setIsSharing(false)
          if (e instanceof InvalidPinError) {
            onPinError?.()
            return handleError({ reason: 'Invalid PIN entered', redirect: false })
          }

          return handleError({
            reason: 'Authentication failed',
            description:
              e instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${e.message}` : undefined,
            redirect: true,
          })
        }
      }

      try {
        console.log(JSON.stringify(credentialsForRequest, null, 2))

        await shareProof({
          agent,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
          acceptTransactionData: formattedTransactionData?.type === 'qes_authorization',
        })

        onPinComplete?.()
        await addSharedActivityForCredentialsForRequest(
          agent,
          credentialsForRequest,
          'success',
          formattedTransactionData
        ).catch(console.error)
      } catch (error) {
        setIsSharing(false)
        if (error instanceof BiometricAuthenticationCancelledError) {
          return handleError({ reason: 'Biometric authentication cancelled' })
        }

        if (credentialsForRequest) {
          await addSharedActivityForCredentialsForRequest(
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
          reason: 'Presentation could not be shared.',
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
      isDevelopmentModeEnabled,
      handleError,
      formattedTransactionData,
    ]
  )

  const onProofDecline = async () => {
    stopOverAsking()
    if (credentialsForRequest) {
      await addSharedActivityForCredentialsForRequest(
        agent,
        credentialsForRequest,
        credentialsForRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed',
        formattedTransactionData
      ).catch(console.error)
    }

    pushToWallet()
    toast.show('Information request has been declined.', { customData: { preset: 'danger' } })
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={shouldUsePin ?? false}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={credentialsForRequest?.formattedSubmission}
      isAccepting={isSharing}
      entityId={credentialsForRequest?.verifier.entityId as string}
      verifierName={credentialsForRequest?.verifier.name}
      logo={credentialsForRequest?.verifier.logo}
      trustedEntities={credentialsForRequest?.verifier.trustedEntities}
      lastInteractionDate={lastInteractionDate}
      onComplete={() => pushToWallet('replace')}
      overAskingResponse={overAskingResponse}
      transaction={formattedTransactionData}
    />
  )
}
