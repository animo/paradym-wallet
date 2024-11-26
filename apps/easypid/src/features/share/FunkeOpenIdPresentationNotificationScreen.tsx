import {
  BiometricAuthenticationCancelledError,
  type CredentialsForProofRequest,
  type FormattedSubmissionEntrySatisfied,
  getCredentialsForProofRequest,
  getDisclosedAttributeNamesForDisplay,
  shareProof,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState, useCallback } from 'react'

import { useAppAgent } from '@easypid/agent'
import { analyzeVerification } from '@easypid/use-cases/ValidateVerification'
import type { VerificationAnalysisResponse } from '@easypid/use-cases/ValidateVerification'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { setWalletServiceProviderPin } from '../../crypto/WalletServiceProviderClient'
import { useShouldUsePinForSubmission } from '../../hooks/useShouldUsePinForPresentation'
import { addSharedActivityForCredentialsForRequest, useActivities } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'
import type { PresentationRequestResult } from './components/utils'

type Query = { uri?: string; data?: string }

export function FunkeOpenIdPresentationNotificationScreen() {
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()

  const [credentialsForRequest, setCredentialsForRequest] = useState<CredentialsForProofRequest>()
  const [isSharing, setIsSharing] = useState(false)
  const { activities } = useActivities({
    filters: { entityId: credentialsForRequest?.verifier.entityId ?? 'NO MATCH' },
  })
  const lastInteractionDate = activities?.[0]?.date
  const shouldUsePin = useShouldUsePinForSubmission(credentialsForRequest)

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      data: params.data,
      uri: params.uri,
    })
      .then(setCredentialsForRequest)
      .catch((error) => {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      })
  }, [credentialsForRequest, params.data, params.uri, toast.show, agent, pushToWallet, toast])

  const [verificationAnalysis, setVerificationAnalysis] = useState<{
    isLoading: boolean
    result: VerificationAnalysisResponse | undefined
  }>({
    isLoading: false,
    result: undefined,
  })

  useEffect(() => {
    if (!credentialsForRequest?.formattedSubmission || !credentialsForRequest?.formattedSubmission.areAllSatisfied) {
      return
    }
    setVerificationAnalysis((prev) => ({ ...prev, isLoading: true }))

    const submission = credentialsForRequest.formattedSubmission
    const requestedCards = submission.entries
      .filter((entry): entry is FormattedSubmissionEntrySatisfied => entry.isSatisfied)
      .flatMap((entry) => entry.credentials)

    analyzeVerification({
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
    }).then((result) => setVerificationAnalysis((prev) => ({ ...prev, isLoading: false, result })))
  }, [credentialsForRequest])

  const onProofAccept = useCallback(
    async (pin?: string): Promise<PresentationRequestResult> => {
      if (!credentialsForRequest)
        return {
          status: 'error',
          result: {
            title: 'No credentials selected',
          },
        }

      setIsSharing(true)

      if (shouldUsePin) {
        // TODO: we should handle invalid pin
        if (!pin) {
          return {
            status: 'error',
            result: {
              title: 'Authentication failed',
            },
          }
        }
        // TODO: maybe provide to shareProof method?
        setWalletServiceProviderPin(pin.split('').map(Number))
      }

      try {
        await shareProof({
          agent,
          resolvedRequest: credentialsForRequest,
          selectedCredentials: {},
        })

        await addSharedActivityForCredentialsForRequest(agent, credentialsForRequest, 'success')
        return {
          status: 'success',
          result: {
            title: 'Presentation shared',
          },
        }
      } catch (error) {
        setIsSharing(false)
        if (error instanceof BiometricAuthenticationCancelledError) {
          return {
            status: 'error',
            result: {
              title: 'Biometric authentication cancelled',
            },
          }
        }

        if (credentialsForRequest) {
          await addSharedActivityForCredentialsForRequest(agent, credentialsForRequest, 'failed')
        }

        agent.config.logger.error('Error accepting presentation', {
          error,
        })
        return {
          status: 'error',
          redirectToWallet: true,
          result: {
            title: 'Presentation could not be shared.',
          },
        }
      }
    },
    [credentialsForRequest, agent, shouldUsePin]
  )

  const onProofDecline = async () => {
    if (credentialsForRequest) {
      await addSharedActivityForCredentialsForRequest(
        agent,
        credentialsForRequest,
        credentialsForRequest.formattedSubmission.areAllSatisfied ? 'stopped' : 'failed'
      )
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
      verificationAnalysis={verificationAnalysis}
    />
  )
}
