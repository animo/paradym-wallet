import { ClaimFormat } from '@credo-ts/core'
import { useAppAgent } from '@easypid/agent'
import { usePidCredential } from '@easypid/hooks'
import { usePushToWallet } from '@package/app/src/hooks/usePushToWallet'
import { useToastController } from '@package/ui'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { addSharedActivity } from '../activity/activityRecord'
import { FunkeOfflineSharingScreen } from './FunkeOfflineSharingScreen'
import type { PresentationRequestResult } from './components/utils'

type Query = { uri?: string; data?: string }

// Entry point for offline sharing with Mdoc
export function FunkeMdocOfflineSharingScreen() {
  const toast = useToastController()
  const params = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const { agent } = useAppAgent()
  const { pidCredentialForDisplay } = usePidCredential()

  const [verifierName, setVerifierName] = useState<string>()
  const [verifierHostName, setVerifierHostName] = useState<string>()
  const [credentialsForRequest, setCredentialsForRequest] = useState<Record<string, unknown>>()
  const [submission, setSubmission] = useState<Record<string, unknown>>()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // ==== PARSE PARAMS ====
    // ==== SET CREDENTIALS FOR REQUEST ====
    // ==== FORMAT CREDENTIALS FOR REQUEST INTO SUBMISSION ====

    // ==== EXAMPLE SUBMISSION ====
    setSubmission({
      name: 'Personal Info Request',
      areAllSatisfied: true,
      entries: [
        {
          inputDescriptorId: '123',
          isSatisfied: true,
          name: 'Personal Info',
          credentials: [
            {
              id: pidCredentialForDisplay?.id,
              credentialName: pidCredentialForDisplay?.display.name,
              issuerName: pidCredentialForDisplay?.display.issuer.name,
              issuerImage: pidCredentialForDisplay?.display.issuer.logo,
              requestedAttributes: ['Given name'],
              disclosedPayload: {
                'Given name': pidCredentialForDisplay?.attributesForDisplay['Given name'],
              },
              claimFormat: ClaimFormat.MsoMdoc,
              metadata: pidCredentialForDisplay?.metadata,
              backgroundColor: pidCredentialForDisplay?.display.backgroundColor,
              textColor: pidCredentialForDisplay?.display.textColor,
              backgroundImage: pidCredentialForDisplay?.display.backgroundImage,
            },
          ],
        },
      ],
    })
  }, [pidCredentialForDisplay])

  const onProofAccept = async (): Promise<PresentationRequestResult> => {
    setIsProcessing(true)

    // ==== ADD ACCEPT LOGIC HERE ====

    await addSharedActivity(agent, {
      status: 'success',
      entity: {
        name: verifierName ?? 'Unknown party',
        host: verifierHostName ?? 'https://example.com',
      },
      request: {
        name: submission?.name as string,
        purpose: submission?.purpose as string,
        credentials: [],
      },
    })

    setIsProcessing(false)

    return {
      status: 'success',
      result: {
        title: 'Proof accepted',
      },
    }
  }

  const onProofDecline = async () => {
    setIsProcessing(true)

    // ==== ADD DECLINE LOGIC HERE ====

    await addSharedActivity(agent, {
      status: 'failed',
      entity: {
        name: verifierName ?? 'Unknown party',
        host: verifierHostName ?? 'https://example.com',
      },
      request: {
        name: submission?.name as string,
        purpose: submission?.purpose as string,
        credentials: [],
        failureReason: submission ? 'missing_credentials' : 'unknown',
      },
    })

    setIsProcessing(false)

    pushToWallet()
    toast.show('Proof has been declined.', { customData: { preset: 'danger' } })
  }

  return (
    <FunkeOfflineSharingScreen
      verifierName={verifierName}
      isAccepting={isProcessing}
      submission={submission}
      onAccept={onProofAccept}
      onDecline={onProofDecline}
      onComplete={() => pushToWallet('replace')}
    />
  )
}
