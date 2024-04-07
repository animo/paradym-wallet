import {
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
  formatDifPexCredentialsForRequest,
} from '@internal/agent'
import { useToastController, Spinner, Page, Paragraph } from '@internal/ui'
import React, { useEffect, useState, useMemo } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

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
        setCredentialsForRequest(credentialsForRequest)
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

  if (!submission || !credentialsForRequest) {
    return (
      <Page jc="center" ai="center" g="md">
        <Spinner />
        <Paragraph variant="sub" textAlign="center">
          Getting verification information
        </Paragraph>
      </Page>
    )
  }

  const onProofAccept = () => {
    setIsSharing(true)

    shareProof({
      agent,
      authorizationRequest: credentialsForRequest.authorizationRequest,
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
      verifierName={credentialsForRequest.verifierHostName}
    />
  )
}
