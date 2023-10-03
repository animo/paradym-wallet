import { useAcceptDidCommPresentation, useAgent } from '@internal/agent'
import { useToastController, Spinner, Page, Paragraph } from '@internal/ui'
import React from 'react'
import { createParam } from 'solito'
import { useRouter } from 'solito/router'

import { PresentationNotificationScreen } from './components/PresentationNotificationScreen'

type Query = { proofExchangeId: string }

const { useParams } = createParam<Query>()

export function DidCommPresentationNotificationScreen() {
  const { agent } = useAgent()

  const router = useRouter()
  const toast = useToastController()
  const { params } = useParams()

  const {
    acceptPresentation,
    proofExchange,
    status,
    submission,
    verifierName,
    setCredentialIndexForSubmissionEntryIndex,
    submissionEntryIndexes,
  } = useAcceptDidCommPresentation(params.proofExchangeId)

  const pushToWallet = () => {
    router.back()
    router.push('/')
  }

  if (!submission || !proofExchange || !submissionEntryIndexes) {
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
    acceptPresentation()
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
    void agent.proofs.deleteById(proofExchange.id)

    toast.show('Information request has been declined.')
    pushToWallet()
  }

  return (
    <PresentationNotificationScreen
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      submission={submission}
      // If state is not idle, it means we have pressed accept
      isAccepting={status !== 'idle'}
      verifierName={verifierName}
      submissionEntryIndexes={submissionEntryIndexes}
      onSelectCredentialIndexForSubmissionEntryIndex={setCredentialIndexForSubmissionEntryIndex}
    />
  )
}
