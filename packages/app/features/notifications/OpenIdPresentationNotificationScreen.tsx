import {
  getCredentialsForProofRequest,
  shareProof,
  useAgent,
  formatW3cPresentationSubmission,
} from '@internal/agent'
import { useToastController, Spinner, Page, Paragraph } from '@internal/ui'
import React, { useEffect, useState, useMemo } from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

type Query = { uri: string }

const { useParam } = createParam<Query>()

export function OpenIdPresentationNotificationScreen() {
  const { agent } = useAgent()
  const router = useRouter()
  const toast = useToastController()
  const [uri] = useParam('uri')

  // TODO: update to useAcceptOpenIdPresentation
  const [credentialsForRequest, setCredentialsForRequest] =
    useState<Awaited<ReturnType<typeof getCredentialsForProofRequest>>>()
  const [isSharing, setIsSharing] = useState(false)

  const submission = useMemo(
    () =>
      credentialsForRequest
        ? formatW3cPresentationSubmission(credentialsForRequest.selectResults)
        : undefined,
    [credentialsForRequest]
  )

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  useEffect(() => {
    if (!uri) return

    getCredentialsForProofRequest({ agent, data: decodeURIComponent(uri) })
      .then((r) => {
        setCredentialsForRequest(r)
      })
      .catch(() => {
        toast.show('Presentation information could not be extracted.')
        pushToWallet()
      })
  }, [uri])

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
    shareProof({ ...credentialsForRequest, agent })
      .then(() => {
        toast.show('Information has been successfully shared.')
      })
      .catch(() => {
        toast.show('Presentation could not be shared.')
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
