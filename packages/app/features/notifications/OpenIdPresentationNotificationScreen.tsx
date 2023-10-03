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

  const [submissionEntryIndexes, setSubmissionEntryIndexes] = useState<number[]>()

  // Sets the initial indexes for all credentials for the submission entries
  // 0 if credential is available, -1 if not
  useEffect(() => {
    if (!submission) return
    const indexes = submission.entries.map((entry) => (entry.isSatisfied ? 0 : -1))
    setSubmissionEntryIndexes(indexes)
  }, [submission])

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
      .catch((e) => {
        console.error(e)
        toast.show('Presentation information could not be extracted.')
        pushToWallet()
      })
  }, [uri])

  if (!submission || !submissionEntryIndexes || !credentialsForRequest) {
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
    shareProof({ ...credentialsForRequest, agent, submissionEntryIndexes })
      .then(() => {
        toast.show('Information has been successfully shared.')
      })
      .catch((e) => {
        console.error(e)
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
      submissionEntryIndexes={submissionEntryIndexes}
      onSelectCredentialIndexForSubmissionEntryIndex={(credentialIndex, submissionEntryIndex) =>
        setSubmissionEntryIndexes((prevIndexes) => {
          if (!prevIndexes) return prevIndexes
          const newIndexes = [...prevIndexes]
          newIndexes[submissionEntryIndex] = credentialIndex
          return newIndexes
        })
      }
      isAccepting={isSharing}
      verifierName={credentialsForRequest.verifierHostName}
    />
  )
}
