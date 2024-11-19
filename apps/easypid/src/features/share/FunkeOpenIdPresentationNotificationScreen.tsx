import {
  BiometricAuthenticationCancelledError,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  shareProof,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState, useMemo, useCallback } from 'react'

import { useAppAgent } from '@easypid/agent'
import { getOpenIdFedIssuerMetadata } from '@easypid/utils/issuer'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { isPidCredential } from '../../hooks'
import { addSharedActivity, useActivities } from '../activity/activityRecord'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'

type Query = { uri?: string; data?: string }

export interface PresentationRequestResult {
  status: 'success' | 'error'
  result: {
    title: string
    message?: string
  }
  redirectToWallet?: boolean
}

export function FunkeOpenIdPresentationNotificationScreen() {
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const { activities } = useActivities()

  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const fedDisplayData = useMemo(
    () => credentialsForRequest && getOpenIdFedIssuerMetadata(credentialsForRequest?.verifierHostName ?? ''),
    [credentialsForRequest]
  )
  const lastInteractionDate = useMemo(() => {
    const activity = activities.find((activity) => activity.entity.host === credentialsForRequest?.verifierHostName)
    return activity?.date
  }, [activities, credentialsForRequest])

  const usePin = useMemo(() => {
    const isPidInSubmission =
      credentialsForRequest?.formattedSubmission?.entries.some((entry) =>
        entry.credentials.some((credential) => isPidCredential(credential.metadata?.type))
      ) ?? false
    // TODO: usePin when HSM or no PID
    return !isPidInSubmission
  }, [credentialsForRequest])

  useEffect(() => {
    if (credentialsForRequest) return

    getCredentialsForProofRequest({
      agent,
      data: params.data,
      uri: params.uri,
      allowUntrustedCertificates: true,
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

  const onProofAccept = useCallback(async (): Promise<PresentationRequestResult> => {
    if (!credentialsForRequest)
      return {
        status: 'error',
        result: {
          title: 'No credentials selected',
        },
      }

    setIsSharing(true)

    try {
      await shareProof({
        agent,
        authorizationRequest: credentialsForRequest.authorizationRequest,
        credentialsForRequest: credentialsForRequest.credentialsForRequest,
        selectedCredentials: {},
        allowUntrustedCertificate: true,
      })

      // TODO: only add first one to activity?
      const credentialsWithDisclosedPayload = credentialsForRequest.formattedSubmission.entries.flatMap((entry) => {
        return entry.credentials.map((credential) => {
          return {
            id: credential.id,
            disclosedAttributes: credential.requestedAttributes ?? [],
            disclosedPayload: credential.disclosedPayload ?? {},
          }
        })
      })

      await addSharedActivity(agent, {
        status: 'success',
        entity: {
          name: fedDisplayData ? fedDisplayData.display.name : credentialsForRequest.verifierHostName,
          logo: fedDisplayData ? fedDisplayData.display.logo : undefined,
          host: credentialsForRequest.verifierHostName as string,
        },
        request: {
          name: credentialsForRequest.formattedSubmission.name,
          purpose: credentialsForRequest.formattedSubmission.purpose,
          credentials: credentialsWithDisclosedPayload ?? [],
        },
      })

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
  }, [credentialsForRequest, agent, fedDisplayData])

  const onProofDecline = async () => {
    // TODO: only add first one to activity?
    const credentialsWithDisclosedPayload = credentialsForRequest?.formattedSubmission.entries.flatMap((entry) => {
      return entry.credentials.map((credential) => {
        return {
          id: credential.id,
          disclosedAttributes: credential.requestedAttributes ?? [],
          disclosedPayload: credential.disclosedPayload ?? {},
        }
      })
    })

    const activityData = {
      entity: {
        host: credentialsForRequest?.verifierHostName as string,
        name: fedDisplayData ? fedDisplayData.display.name : credentialsForRequest?.verifierHostName,
        logo: fedDisplayData ? fedDisplayData.display.logo : undefined,
      },
      request: {
        name: credentialsForRequest?.formattedSubmission?.name,
        purpose: credentialsForRequest?.formattedSubmission?.purpose,
        credentials: credentialsWithDisclosedPayload ?? [],
      },
    }

    if (credentialsForRequest?.formattedSubmission?.areAllSatisfied) {
      await addSharedActivity(agent, { ...activityData, status: 'stopped' })
    } else {
      await addSharedActivity(agent, {
        ...activityData,
        status: 'failed',
        request: {
          ...activityData.request,
          failureReason: credentialsForRequest?.formattedSubmission ? 'missing_credentials' : 'unknown',
        },
      })
    }

    pushToWallet()
    toast.show('Information request has been declined.', { customData: { preset: 'danger' } })
  }

  return (
    <FunkePresentationNotificationScreen
      usePin={usePin}
      onAccept={onProofAccept}
      // TODO: accept with pin
      onAcceptWithPin={onProofAccept}
      onDecline={onProofDecline}
      submission={credentialsForRequest?.formattedSubmission}
      isAccepting={isSharing}
      host={credentialsForRequest?.verifierHostName as string}
      verifierName={fedDisplayData?.display.name}
      logo={fedDisplayData?.display.logo}
      lastInteractionDate={lastInteractionDate}
      approvalsCount={fedDisplayData?.approvals.length}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
