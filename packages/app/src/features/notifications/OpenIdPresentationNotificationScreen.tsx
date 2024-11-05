import {
  BiometricAuthenticationCancelledError,
  formatDifPexCredentialsForRequest,
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
} from '@package/agent'
import { useToastController } from '@package/ui'
import { useRouter } from 'expo-router'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { createParam } from 'solito'

import { GettingInformationScreen } from './components/GettingInformationScreen'
import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

type Query = { uri?: string; data?: string }

const { useParams } = createParam<Query>()

export function OpenIdPresentationNotificationScreen() {
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

  const [selectedCredentials, setSelectedCredentials] = useState<{
    [inputDescriptorId: string]: string
  }>({})

  const pushToWallet = useCallback(() => {
    router.back()
    router.push('/')
  }, [router.back, router.push])

  useEffect(() => {
    async function handleRequest() {
      try {
        const cfr = await getCredentialsForProofRequest({
          agent,
          data: params.data,
          uri: params.uri,
        })
        setCredentialsForRequest(cfr)
      } catch (error: unknown) {
        toast.show('Presentation information could not be extracted.', {
          customData: { preset: 'danger' },
        })
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      }
    }

    void handleRequest()
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
      selectedCredentials,
    })
      .then(() => {
        toast.show('Information has been successfully shared.', {
          customData: { preset: 'success' },
        })
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
    <PresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      isAccepting={isSharing}
      verifierName={credentialsForRequest.verifierHostName}
      selectedCredentials={selectedCredentials}
      onSelectCredentialForInputDescriptor={(inputDescriptorId: string, credentialId: string) =>
        setSelectedCredentials((selectedCredentials) => ({
          ...selectedCredentials,
          [inputDescriptorId]: credentialId,
        }))
      }
    />
  )
}
