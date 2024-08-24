import {
  BiometricAuthenticationCancelledError,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { GettingInformationScreen } from '@package/app/src/features/notifications/components/GettingInformationScreen'
import { FunkePresentationNotificationScreen } from './FunkePresentationNotificationScreen'

type Query = { uri?: string; data?: string }

const { useParams } = createParam<Query>()

export function FunkeOpenIdPresentationNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const { params } = useParams()

  // TODO: update to useAcceptOpenIdPresentation
  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const submission = useMemo(
    () =>
      credentialsForRequest
        ? formatDifPexCredentialsForRequest(credentialsForRequest.credentialsForRequest)
        : undefined,
    [credentialsForRequest]
  )

  const pushToWallet = useCallback(() => {
    router.back()
  }, [router.back])

  useEffect(() => {
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
  }, [params, toast.show, agent, pushToWallet, toast])

  if (!submission || !credentialsForRequest) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    setIsSharing(true)

    shareProof({
      agent,
      authorizationRequest: credentialsForRequest.authorizationRequest,
      credentialsForRequest: credentialsForRequest.credentialsForRequest,
      selectedCredentials: {},
    })
      .then(() => {
        toast.show('Information has been successfully shared.', { customData: { preset: 'success' } })
        pushToWallet()
      })
      .catch((e) => {
        if (e instanceof BiometricAuthenticationCancelledError) {
          toast.show('Biometric authentication cancelled', {
            customData: { preset: 'danger' },
          })
          setIsSharing(false)
          return
        }

        toast.show('Presentation could not be shared.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error accepting presentation', {
          error: e,
        })
        pushToWallet()
      })
  }

  const onProofDecline = () => {
    pushToWallet()
    toast.show('Information request has been declined.')
  }

  return (
    <FunkePresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={isSharing}
      verifierHost={
        credentialsForRequest.verifierHostName ? `https://${credentialsForRequest.verifierHostName}` : undefined
      }
    />
  )
}
