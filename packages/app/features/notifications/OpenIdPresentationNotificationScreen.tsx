import type {
  DifPexInputDescriptorToCredentials,
  FormattedSubmission,
  SdJwtVcRecord,
  W3cCredentialRecord,
} from '@internal/agent'

import {
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
  formatDifPexCredentialsForRequest,
} from '@internal/agent'
import { useToastController } from '@internal/ui'
import React, { useEffect, useState, useMemo } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

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
  const [submission, setSubmission] = useState<FormattedSubmission>()

  const [isSharing, setIsSharing] = useState(false)
  const [selectedCredentials, setSelectedCredentials] = useState<{
    [inputDescriptorId: string]: number | undefined /* index */
  }>({})

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  useEffect(() => {
    async function handleRequest() {
      try {
        const credentialsForRequest = await getCredentialsForProofRequest({
          agent,
          data: params.data,
          uri: params.uri,
        })

        const s = formatDifPexCredentialsForRequest(credentialsForRequest.credentialsForRequest)
        setCredentialsForRequest(credentialsForRequest)
        setSubmission(s)
      } catch (error: unknown) {
        toast.show('Presentation information could not be extracted.')
        agent.config.logger.error('Error getting credentials for request', {
          error,
        })

        pushToWallet()
      }
    }

    void handleRequest()
  }, [params])

  if (!submission || !credentialsForRequest || !selectedCredentials) {
    return <GettingInformationScreen type="presentation" />
  }

  const onProofAccept = () => {
    setIsSharing(true)

    shareProof({
      agent,
      authorizationRequest: credentialsForRequest.authorizationRequest,
      selectedCredentials: {},
      credentialsForRequest: credentialsForRequest.credentialsForRequest,
    })
      .then(() => {
        toast.show('Information has been successfully shared.')
      })
      .catch((e) => {
        toast.show('Presentation could not be shared.')
        agent.config.logger.error('Error accepting presentation', {
          error: e as unknown,
        })
      })
      .finally(() => {
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
      selectedCredentials={selectedCredentials}
      onSelectCredentialForInputDescriptor={(inputDescriptorId: string, index: number) =>
        setSelectedCredentials((selectedCredentials) => ({
          ...selectedCredentials,
          [inputDescriptorId]: index,
        }))
      }
      verifierName={credentialsForRequest.verifierHostName}
    />
  )
}
